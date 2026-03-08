import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service.js'

interface GoogleProfile {
  googleId: string
  email: string
  name: string
  avatarUrl?: string
}

interface DevLoginProfile {
  email: string
  name: string
}

function parseExpirationToMs(expiration: string): number {
  const match = expiration.match(/^(\d+)([smhd])$/)
  if (!match) return 24 * 60 * 60 * 1000 // default 24h
  const value = parseInt(match[1], 10)
  const unit = match[2]
  switch (unit) {
    case 's':
      return value * 1000
    case 'm':
      return value * 60 * 1000
    case 'h':
      return value * 60 * 60 * 1000
    case 'd':
      return value * 24 * 60 * 60 * 1000
    default:
      return 24 * 60 * 60 * 1000
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async findOrCreateGoogleUser(
    profile: GoogleProfile,
  ): Promise<{ accessToken: string; expiresInMs: number }> {
    const user = await this.prisma.client.user.upsert({
      where: { email: profile.email },
      update: {
        googleId: profile.googleId,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
      create: {
        email: profile.email,
        googleId: profile.googleId,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
    })

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    })

    const expiration = this.configService.get<string>('JWT_EXPIRATION', '24h')
    const expiresInMs = parseExpirationToMs(expiration)

    return { accessToken, expiresInMs }
  }

  async findOrCreateDevUser(profile: DevLoginProfile) {
    const user = await this.prisma.client.user.upsert({
      where: { email: profile.email },
      update: { name: profile.name },
      create: {
        email: profile.email,
        name: profile.name,
      },
    })

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    })

    const expiration = this.configService.get<string>('JWT_EXPIRATION', '24h')
    const expiresInMs = parseExpirationToMs(expiration)

    return { user, accessToken, expiresInMs }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User no longer exists')
    }

    return user
  }
}
