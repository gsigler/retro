import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { SkipThrottle } from '@nestjs/throttler'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service.js'
import { TimerService } from './timer.service.js'
import { CardResponse } from './dto/card-response.dto.js'
import { ColumnResponse } from './dto/column-response.dto.js'
import { ActionItemResponse } from '../action-items/dto/action-item-response.dto.js'
import type { RetroPhase } from '../retros/retros.service.js'

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string
    email: string
    userName?: string
  }
}

@SkipThrottle()
@WebSocketGateway({
  namespace: '/board',
  cors: {
    origin: process.env.APP_URL ?? 'http://localhost:5173',
  },
})
export class BoardGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly timerService: TimerService,
  ) {}

  afterInit(server: Server) {
    server.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
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
    @MessageBody() data: { retroId: string; duration?: number },
  ) {
    if (!data?.retroId) return
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
    @MessageBody() data: { retroId: string },
  ) {
    if (!data?.retroId) return
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
    @MessageBody() data: { retroId: string },
  ) {
    if (!data?.retroId) return
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
    for (const room of client.rooms) {
      if (room.startsWith('retro:')) {
        client.to(room).emit('board:user-left', {
          userId: client.data?.userId,
        })

        const retroId = room.replace('retro:', '')
        const sockets = await this.server.in(room).fetchSockets()
        if (sockets.length === 0) {
          this.timerService.cleanup(retroId)
        }
      }
    }
  }

  @SubscribeMessage('board:join')
  async handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { retroId: string },
  ) {
    if (!data?.retroId || typeof data.retroId !== 'string') {
      return
    }

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

    const timerState = this.timerService.getState(data.retroId)
    if (timerState) {
      client.emit('timer:sync', timerState)
    }
  }

  @SubscribeMessage('board:leave')
  handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { retroId: string },
  ) {
    if (!data?.retroId || typeof data.retroId !== 'string') {
      return
    }

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
