import { randomUUID } from 'node:crypto'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service'
import { EmailService } from './email.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async sendMagicLink(email: string): Promise<{ message: string }> {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await this.prisma.magicLink.create({
      data: { token, email, expiresAt },
    })

    await this.emailService.sendMagicLink(email, token)

    return { message: 'If an account exists, a magic link has been sent.' }
  }

  async verifyMagicLink(token: string): Promise<{ accessToken: string }> {
    const magicLink = await this.prisma.magicLink.findUnique({
      where: { token },
    })

    if (!magicLink) {
      throw new UnauthorizedException('Invalid or expired token')
    }

    if (magicLink.usedAt) {
      throw new UnauthorizedException('Token has already been used')
    }

    if (magicLink.expiresAt < new Date()) {
      throw new UnauthorizedException('Token has expired')
    }

    await this.prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    })

    const user = await this.prisma.user.upsert({
      where: { email: magicLink.email },
      update: {},
      create: { email: magicLink.email },
    })

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    })

    return { accessToken }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    })
    return user
  }
}
