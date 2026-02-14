import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { EmailService } from './email.service'
import { PrismaService } from '../prisma/prisma.service'

describe('AuthService', () => {
  let service: AuthService
  let prisma: {
    magicLink: {
      create: jest.Mock
      findUnique: jest.Mock
      updateMany: jest.Mock
    }
    user: { upsert: jest.Mock; findUniqueOrThrow: jest.Mock }
  }
  let jwtService: { sign: jest.Mock }
  let emailService: { sendMagicLink: jest.Mock }

  beforeEach(async () => {
    prisma = {
      magicLink: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      user: { upsert: jest.fn(), findUniqueOrThrow: jest.fn() },
    }
    jwtService = { sign: jest.fn() }
    emailService = { sendMagicLink: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('sendMagicLink', () => {
    it('should create a magic link record and send email', async () => {
      prisma.magicLink.create.mockResolvedValue({})
      emailService.sendMagicLink.mockResolvedValue(undefined)

      const result = await service.sendMagicLink('test@example.com')

      expect(prisma.magicLink.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      })
      expect(emailService.sendMagicLink).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      )
      expect(result).toEqual({
        message: 'If an account exists, a magic link has been sent.',
      })
    })
  })

  describe('verifyMagicLink', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should verify token and return JWT', async () => {
      prisma.magicLink.updateMany.mockResolvedValue({ count: 1 })
      prisma.magicLink.findUnique.mockResolvedValue({
        email: 'test@example.com',
      })
      prisma.user.upsert.mockResolvedValue(mockUser)
      jwtService.sign.mockReturnValue('jwt-token')

      const result = await service.verifyMagicLink('valid-token')

      expect(prisma.magicLink.updateMany).toHaveBeenCalledWith({
        where: {
          token: 'valid-token',
          usedAt: null,
          expiresAt: { gte: expect.any(Date) },
        },
        data: { usedAt: expect.any(Date) },
      })
      expect(prisma.magicLink.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid-token' },
        select: { email: true },
      })
      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        update: {},
        create: { email: 'test@example.com' },
      })
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
      })
      expect(result).toEqual({ accessToken: 'jwt-token' })
    })

    it('should reject invalid, used, or expired tokens', async () => {
      prisma.magicLink.updateMany.mockResolvedValue({ count: 0 })

      await expect(service.verifyMagicLink('bad-token')).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        createdAt: new Date(),
      }
      prisma.user.findUniqueOrThrow.mockResolvedValue(mockUser)

      const result = await service.getProfile('user-1')

      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true, email: true, name: true, createdAt: true },
      })
      expect(result).toEqual(mockUser)
    })
  })
})
