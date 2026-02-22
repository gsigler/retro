import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ConfigService } from '@nestjs/config'
import { SkipThrottle } from '@nestjs/throttler'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service.js'

interface TimerState {
  duration: number
  remaining: number
  running: boolean
  startedAt: number | null
}

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

  private timers = new Map<string, TimerState>()
  private timerIntervals = new Map<string, ReturnType<typeof setInterval>>()

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
    if (!(await this.verifyFacilitator(client.data.userId, data.retroId)))
      return

    const room = `retro:${data.retroId}`
    let timer = this.timers.get(data.retroId)

    if (data.duration) {
      this.clearTimerInterval(data.retroId)
      timer = {
        duration: data.duration,
        remaining: data.duration,
        running: true,
        startedAt: Date.now(),
      }
    } else if (timer) {
      timer = { ...timer, running: true, startedAt: Date.now() }
    } else {
      return
    }

    this.timers.set(data.retroId, timer)
    this.server.to(room).emit('timer:sync', {
      duration: timer.duration,
      remaining: timer.remaining,
      running: true,
    })
    this.startTimerInterval(data.retroId)
  }

  @SubscribeMessage('timer:pause')
  async handleTimerPause(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { retroId: string },
  ) {
    if (!data?.retroId) return
    if (!(await this.verifyFacilitator(client.data.userId, data.retroId)))
      return

    const timer = this.timers.get(data.retroId)
    if (!timer || !timer.running) return

    this.clearTimerInterval(data.retroId)
    const elapsed = timer.startedAt
      ? Math.floor((Date.now() - timer.startedAt) / 1000)
      : 0
    const updated: TimerState = {
      ...timer,
      remaining: Math.max(0, timer.remaining - elapsed),
      running: false,
      startedAt: null,
    }
    this.timers.set(data.retroId, updated)
    this.server.to(`retro:${data.retroId}`).emit('timer:sync', {
      duration: updated.duration,
      remaining: updated.remaining,
      running: false,
    })
  }

  @SubscribeMessage('timer:reset')
  async handleTimerReset(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { retroId: string },
  ) {
    if (!data?.retroId) return
    if (!(await this.verifyFacilitator(client.data.userId, data.retroId)))
      return

    this.clearTimerInterval(data.retroId)
    const timer = this.timers.get(data.retroId)
    if (!timer) return

    const updated: TimerState = {
      duration: timer.duration,
      remaining: timer.duration,
      running: false,
      startedAt: null,
    }
    this.timers.set(data.retroId, updated)
    this.server.to(`retro:${data.retroId}`).emit('timer:sync', {
      duration: updated.duration,
      remaining: updated.duration,
      running: false,
    })
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    for (const room of client.rooms) {
      if (room.startsWith('retro:')) {
        client.to(room).emit('board:user-left', {
          userId: client.data?.userId,
        })

        // Clean up timer if room is empty
        const retroId = room.replace('retro:', '')
        const sockets = await this.server.in(room).fetchSockets()
        if (sockets.length === 0) {
          this.clearTimerInterval(retroId)
          this.timers.delete(retroId)
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

    // Send current timer state to the joining client
    const timer = this.timers.get(data.retroId)
    if (timer) {
      const remaining =
        timer.running && timer.startedAt
          ? Math.max(
              0,
              timer.remaining -
                Math.floor((Date.now() - timer.startedAt) / 1000),
            )
          : timer.remaining
      client.emit('timer:sync', {
        duration: timer.duration,
        remaining,
        running: timer.running,
      })
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
    client.to(room).emit('board:user-left', {
      userId: client.data.userId,
    })
    client.leave(room)
  }

  private startTimerInterval(retroId: string) {
    this.clearTimerInterval(retroId)
    const interval = setInterval(() => {
      const timer = this.timers.get(retroId)
      if (!timer || !timer.running || !timer.startedAt) {
        this.clearTimerInterval(retroId)
        return
      }

      const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000)
      const remaining = Math.max(0, timer.remaining - elapsed)

      this.server.to(`retro:${retroId}`).emit('timer:tick', { remaining })

      if (remaining <= 0) {
        this.clearTimerInterval(retroId)
        const updated: TimerState = {
          ...timer,
          remaining: 0,
          running: false,
          startedAt: null,
        }
        this.timers.set(retroId, updated)
        this.server.to(`retro:${retroId}`).emit('timer:sync', updated)
      }
    }, 1000)
    this.timerIntervals.set(retroId, interval)
  }

  private clearTimerInterval(retroId: string) {
    const interval = this.timerIntervals.get(retroId)
    if (interval) {
      clearInterval(interval)
      this.timerIntervals.delete(retroId)
    }
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

  emitBoardInitialized(retroId: string, columns: any) {
    this.server.to(`retro:${retroId}`).emit('board:initialized', {
      retroId,
      columns,
    })
  }

  emitCardCreated(retroId: string, card: any) {
    this.server.to(`retro:${retroId}`).emit('card:created', card)
  }

  emitCardCreatedToAuthor(retroId: string, authorId: string, card: any) {
    const room = `retro:${retroId}`
    const sockets = this.server.in(room).fetchSockets()
    sockets.then((clients) => {
      for (const client of clients) {
        if ((client as any).data?.userId === authorId) {
          client.emit('card:created', card)
        }
      }
    })
  }

  emitCardMoved(retroId: string, card: any) {
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
    data: { parentCard: any; childCardIds: string[] },
  ) {
    this.server.to(`retro:${retroId}`).emit('cards:merged', data)
  }

  emitCardsUnmerged(retroId: string, parentCard: any) {
    this.server.to(`retro:${retroId}`).emit('cards:unmerged', { parentCard })
  }

  emitBoardRevealed(retroId: string, columns: any) {
    this.server
      .to(`retro:${retroId}`)
      .emit('board:revealed', { retroId, columns })
  }

  emitActionItemCreated(retroId: string, item: any) {
    this.server.to(`retro:${retroId}`).emit('action-item:created', item)
  }

  emitActionItemUpdated(retroId: string, item: any) {
    this.server.to(`retro:${retroId}`).emit('action-item:updated', item)
  }

  emitActionItemDeleted(retroId: string, itemId: string) {
    this.server
      .to(`retro:${retroId}`)
      .emit('action-item:deleted', { id: itemId, retroId })
  }

  emitActionItemsReordered(retroId: string, items: any[]) {
    this.server.to(`retro:${retroId}`).emit('action-item:reordered', items)
  }

  emitPhaseChanged(retroId: string, phase: string) {
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
