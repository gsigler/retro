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
import { type AuthenticatedSocket, parseCookies } from '../auth/ws-auth.util.js'

@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@WebSocketGateway({
  namespace: '/dashboard',
  cors: {
    origin: process.env.APP_URL ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class DashboardGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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
          select: { id: true, email: true },
        })

        if (!user) {
          return next(new Error('User not found'))
        }

        socket.data.userId = user.id
        socket.data.email = user.email
        next()
      } catch {
        next(new Error('Authentication failed'))
      }
    })
  }

  @SubscribeMessage('dashboard:join')
  async handleJoin(@ConnectedSocket() client: AuthenticatedSocket) {
    const memberships = await this.prisma.client.teamMember.findMany({
      where: { userId: client.data.userId },
      select: { teamId: true },
    })

    for (const { teamId } of memberships) {
      client.join(`team:${teamId}`)
    }
  }

  @SubscribeMessage('dashboard:leave')
  handleLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { teamId: string },
  ) {
    client.leave(`team:${data.teamId}`)
  }

  handleDisconnect(_client: AuthenticatedSocket) {
    // Socket.io automatically cleans up room memberships on disconnect
  }

  emitRetroCreated(teamId: string) {
    this.server.to(`team:${teamId}`).emit('retro:created', { teamId })
  }

  emitRetroUpdated(teamId: string) {
    this.server.to(`team:${teamId}`).emit('retro:updated', { teamId })
  }

  emitRetroDeleted(teamId: string) {
    this.server.to(`team:${teamId}`).emit('retro:deleted', { teamId })
  }
}
