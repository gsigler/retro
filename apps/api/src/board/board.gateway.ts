import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { ConfigService } from '@nestjs/config'
import * as jwt from 'jsonwebtoken'
import { PrismaService } from '../prisma/prisma.service'

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string
    email: string
    userName?: string
  }
}

@WebSocketGateway({
  namespace: '/board',
  cors: {
    origin: process.env.APP_URL ?? 'http://localhost:5173',
  },
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '')

      if (!token || typeof token !== 'string') {
        client.disconnect()
        return
      }

      const secret = this.configService.getOrThrow<string>('JWT_SECRET')
      const payload = jwt.verify(token, secret) as {
        sub: string
        email: string
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true },
      })

      if (!user) {
        client.disconnect()
        return
      }

      client.data.userId = user.id
      client.data.email = user.email
      client.data.userName = user.name ?? undefined
    } catch {
      client.disconnect()
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    for (const room of client.rooms) {
      if (room.startsWith('retro:')) {
        client.to(room).emit('board:user-left', {
          userId: client.data?.userId,
        })
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

  emitBoardInitialized(retroId: string, columns: any) {
    this.server.to(`retro:${retroId}`).emit('board:initialized', {
      retroId,
      columns,
    })
  }

  emitCardCreated(retroId: string, card: any) {
    this.server.to(`retro:${retroId}`).emit('card:created', card)
  }

  emitCardMoved(retroId: string, card: any) {
    this.server.to(`retro:${retroId}`).emit('card:moved', card)
  }

  emitCardDeleted(retroId: string, cardId: string) {
    this.server
      .to(`retro:${retroId}`)
      .emit('card:deleted', { id: cardId, retroId })
  }

  private async verifyRetroAccess(
    userId: string,
    retroId: string,
  ): Promise<boolean> {
    const retro = await this.prisma.retro.findUnique({
      where: { id: retroId },
      select: { teamId: true },
    })

    if (!retro) return false

    const membership = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: retro.teamId, userId } },
    })

    return !!membership
  }
}
