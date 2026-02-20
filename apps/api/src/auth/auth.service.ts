import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service.js'

interface GoogleProfile {
  googleId: string
  email: string
  name: string
  avatarUrl?: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async findOrCreateGoogleUser(
    profile: GoogleProfile,
  ): Promise<{ accessToken: string }> {
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

    return { accessToken }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    })
    return user
  }
}
