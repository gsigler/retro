import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { UsePipes, ValidationPipe } from '@nestjs/common'
import { Server } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service.js'
import { TimerService } from './timer.service.js'
import { CardResponse } from './dto/card-response.dto.js'
import { ColumnResponse } from './dto/column-response.dto.js'
import { ActionItemResponse } from '../action-items/dto/action-item-response.dto.js'
import { TimerStartDto, RetroIdDto } from './dto/ws-timer.dto.js'
import {
  BoardJoinDto,
  BoardLeaveDto,
  IcebreakerShuffleDto,
} from './dto/ws-board.dto.js'
import type { RetroPhase } from '../retros/retros.service.js'
import { type AuthenticatedSocket, parseCookies } from '../auth/ws-auth.util.js'

@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@WebSocketGateway({
  namespace: '/board',
  cors: {
    origin: process.env.APP_URL ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class BoardGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  private readonly rateLimits = new Map<string, number[]>()
  private readonly icebreakerShuffleCount = new Map<string, number>()
  private readonly RATE_LIMIT_WINDOW_MS = 60_000
  private readonly RATE_LIMIT_MAX = 30

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly timerService: TimerService,
  ) {}

  private checkRateLimit(socketId: string): boolean {
    const now = Date.now()
    const timestamps = this.rateLimits.get(socketId) ?? []
    const recent = timestamps.filter((t) => now - t < this.RATE_LIMIT_WINDOW_MS)
    if (recent.length >= this.RATE_LIMIT_MAX) {
      this.rateLimits.set(socketId, recent)
      return false
    }
    recent.push(now)
    this.rateLimits.set(socketId, recent)
    return true
  }

  afterInit(server: Server) {
    server.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const cookies = parseCookies(
          socket.handshake.headers?.cookie as string | undefined,
        )
        const token =
          cookies['access_token'] ||
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '')

        if (!token || typeof token !== 'string') {
          return next(new Error('Authentication required'))
        }

        const payload = this.jwtService.verify<{
          sub: string
          email: string
        }>(token)

        const user = await this.prisma.client.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, email: true, name: true },
        })

        if (!user) {
          return next(new Error('User not found'))
        }

        socket.data.userId = user.id
        socket.data.email = user.email
        socket.data.userName = user.name ?? undefined
        next()
      } catch {
        next(new Error('Authentication failed'))
      }
    })
  }

  @SubscribeMessage('timer:start')
  async handleTimerStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TimerStartDto,
  ) {
    if (!this.checkRateLimit(client.id)) return
    if (!(await this.verifyFacilitator(client.data.userId, data.retroId))) {
      client.emit('timer:error', {
        message: 'Only the facilitator can control the timer',
      })
      return
    }

    const room = `retro:${data.retroId}`
    const payload = this.timerService.start(
      data.retroId,
      data.duration,
      (remaining) => {
        this.server.to(room).emit('timer:tick', { remaining })
      },
      (syncPayload) => {
        this.server.to(room).emit('timer:sync', syncPayload)
      },
    )

    if (!payload) {
      client.emit('timer:error', {
        message: 'Invalid duration (must be 10-3600 seconds)',
      })
      return
    }

    this.server.to(room).emit('timer:sync', payload)
  }

  @SubscribeMessage('timer:pause')
  async handleTimerPause(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: RetroIdDto,
  ) {
    if (!this.checkRateLimit(client.id)) return
    if (!(await this.verifyFacilitator(client.data.userId, data.retroId))) {
      client.emit('timer:error', {
        message: 'Only the facilitator can control the timer',
      })
      return
    }

    const payload = this.timerService.pause(data.retroId)
    if (payload) {
      this.server.to(`retro:${data.retroId}`).emit('timer:sync', payload)
    }
  }

  @SubscribeMessage('timer:reset')
  async handleTimerReset(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: RetroIdDto,
  ) {
    if (!this.checkRateLimit(client.id)) return
    if (!(await this.verifyFacilitator(client.data.userId, data.retroId))) {
      client.emit('timer:error', {
        message: 'Only the facilitator can control the timer',
      })
      return
    }

    const payload = this.timerService.reset(data.retroId)
    if (payload) {
      this.server.to(`retro:${data.retroId}`).emit('timer:sync', payload)
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.rateLimits.delete(client.id)
    for (const room of client.rooms) {
      if (room.startsWith('retro:')) {
        client.to(room).emit('board:user-left', {
          userId: client.data?.userId,
        })

        const retroId = room.replace('retro:', '')
        const sockets = await this.server.in(room).fetchSockets()
        if (sockets.length === 0) {
          this.timerService.cleanup(retroId)
          this.icebreakerShuffleCount.delete(retroId)
        }
      }
    }
  }

  @SubscribeMessage('board:join')
  async handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: BoardJoinDto,
  ) {
    if (!this.checkRateLimit(client.id)) return
    const hasAccess = await this.verifyRetroAccess(
      client.data.userId,
      data.retroId,
    )
    if (!hasAccess) {
      client.emit('board:error', { message: 'Access denied' })
      return
    }

    const room = `retro:${data.retroId}`
    client.join(room)
    client.to(room).emit('board:user-joined', {
      userId: client.data.userId,
      userName: client.data.userName,
    })

    // Send the joining user the list of everyone already in the room
    const sockets = await this.server.in(room).fetchSockets()
    const roster = sockets
      .map((s) => {
        const sock = s as unknown as AuthenticatedSocket
        return {
          userId: sock.data?.userId,
          userName: sock.data?.userName,
        }
      })
      .filter((u) => u.userId && u.userId !== client.data.userId)
    if (roster.length > 0) {
      client.emit('board:roster', roster)
    }

    const timerState = this.timerService.getState(data.retroId)
    if (timerState) {
      client.emit('timer:sync', timerState)
    }

    const shuffleCount = this.icebreakerShuffleCount.get(data.retroId)
    if (shuffleCount != null) {
      client.emit('icebreaker:shuffled', { shuffleCount })
    }
  }

  @SubscribeMessage('icebreaker:shuffle')
  async handleIcebreakerShuffle(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: IcebreakerShuffleDto,
  ) {
    if (!this.checkRateLimit(client.id)) return
    if (!(await this.verifyFacilitator(client.data.userId, data.retroId))) {
      client.emit('board:error', {
        message: 'Only the facilitator can shuffle the icebreaker',
      })
      return
    }

    this.icebreakerShuffleCount.set(data.retroId, data.shuffleCount)

    const room = `retro:${data.retroId}`
    client.to(room).emit('icebreaker:shuffled', {
      shuffleCount: data.shuffleCount,
    })
  }

  @SubscribeMessage('board:leave')
  handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: BoardLeaveDto,
  ) {
    if (!this.checkRateLimit(client.id)) return
    const room = `retro:${data.retroId}`
    if (!client.rooms.has(room)) {
      return
    }

    client.to(room).emit('board:user-left', {
      userId: client.data.userId,
    })
    client.leave(room)
  }

  private async verifyFacilitator(
    userId: string,
    retroId: string,
  ): Promise<boolean> {
    const retro = await this.prisma.client.retro.findUnique({
      where: { id: retroId },
      select: { createdById: true },
    })
    return retro?.createdById === userId
  }

  emitBoardInitialized(retroId: string, columns: ColumnResponse[]) {
    this.server.to(`retro:${retroId}`).emit('board:initialized', {
      retroId,
      columns,
    })
  }

  emitCardCreated(retroId: string, card: CardResponse) {
    this.server.to(`retro:${retroId}`).emit('card:created', card)
  }

  async emitCardCreatedToAuthor(
    retroId: string,
    authorId: string,
    card: CardResponse,
  ) {
    const room = `retro:${retroId}`
    const clients = await this.server.in(room).fetchSockets()
    for (const client of clients) {
      const socket = client as unknown as AuthenticatedSocket
      if (socket.data?.userId === authorId) {
        client.emit('card:created', card)
      }
    }
  }

  async emitCardCreatedHidden(
    retroId: string,
    authorId: string,
    fullCard: CardResponse,
    hiddenCard: CardResponse,
  ) {
    const room = `retro:${retroId}`
    const clients = await this.server.in(room).fetchSockets()
    for (const client of clients) {
      const socket = client as unknown as AuthenticatedSocket
      if (socket.data?.userId === authorId) {
        client.emit('card:created', fullCard)
      } else {
        client.emit('card:created', hiddenCard)
      }
    }
  }

  emitCardMoved(retroId: string, card: CardResponse) {
    this.server.to(`retro:${retroId}`).emit('card:moved', card)
  }

  emitCardDeleted(retroId: string, cardId: string) {
    this.server
      .to(`retro:${retroId}`)
      .emit('card:deleted', { id: cardId, retroId })
  }

  emitCardVoted(
    retroId: string,
    data: { cardId: string; voteCount: number; userId: string },
  ) {
    this.server.to(`retro:${retroId}`).emit('card:voted', data)
  }

  emitCardUnvoted(
    retroId: string,
    data: { cardId: string; voteCount: number; userId: string },
  ) {
    this.server.to(`retro:${retroId}`).emit('card:unvoted', data)
  }

  emitCardsMerged(
    retroId: string,
    data: { parentCard: CardResponse; childCardIds: string[] },
  ) {
    this.server.to(`retro:${retroId}`).emit('cards:merged', data)
  }

  emitCardsUnmerged(retroId: string, parentCard: CardResponse) {
    this.server.to(`retro:${retroId}`).emit('cards:unmerged', { parentCard })
  }

  emitBoardRevealed(retroId: string, columns: ColumnResponse[]) {
    this.server
      .to(`retro:${retroId}`)
      .emit('board:revealed', { retroId, columns })
  }

  emitActionItemCreated(retroId: string, item: ActionItemResponse) {
    this.server.to(`retro:${retroId}`).emit('action-item:created', item)
  }

  emitActionItemUpdated(retroId: string, item: ActionItemResponse) {
    this.server.to(`retro:${retroId}`).emit('action-item:updated', item)
  }

  emitActionItemDeleted(retroId: string, itemId: string) {
    this.server
      .to(`retro:${retroId}`)
      .emit('action-item:deleted', { id: itemId, retroId })
  }

  emitActionItemsReordered(retroId: string, items: ActionItemResponse[]) {
    this.server.to(`retro:${retroId}`).emit('action-item:reordered', items)
  }

  emitPhaseChanged(retroId: string, phase: RetroPhase) {
    this.server
      .to(`retro:${retroId}`)
      .emit('retro:phase-changed', { retroId, phase })
  }

  private async verifyRetroAccess(
    userId: string,
    retroId: string,
  ): Promise<boolean> {
    const retro = await this.prisma.client.retro.findUnique({
      where: { id: retroId },
      select: { teamId: true },
    })

    if (!retro) return false

    const membership = await this.prisma.client.teamMember.findUnique({
      where: { teamId_userId: { teamId: retro.teamId, userId } },
    })

    return !!membership
  }
}
