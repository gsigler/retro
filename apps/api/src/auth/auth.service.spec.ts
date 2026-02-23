import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { AuthService } from './auth.service.js'
import { PrismaService } from '../prisma/prisma.service.js'

describe('AuthService', () => {
  let service: AuthService
  let prisma: {
    client: { user: { upsert: jest.Mock; findUnique: jest.Mock } }
  }
  let jwtService: { sign: jest.Mock }

  beforeEach(async () => {
    prisma = {
      client: {
        user: { upsert: jest.fn(), findUnique: jest.fn() },
      },
    }
    jwtService = { sign: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockImplementation((_key: string, defaultVal: string) => {
                return defaultVal ?? '24h'
              }),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('findOrCreateGoogleUser', () => {
    const googleProfile = {
      googleId: 'google-123',
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: 'https://example.com/photo.jpg',
    }

    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      googleId: 'google-123',
      avatarUrl: 'https://example.com/photo.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('should upsert user by email and return JWT with expiry', async () => {
      prisma.client.user.upsert.mockResolvedValue(mockUser)
      jwtService.sign.mockReturnValue('jwt-token')

      const result = await service.findOrCreateGoogleUser(googleProfile)

      expect(prisma.client.user.upsert).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        update: {
          googleId: 'google-123',
          name: 'Test User',
          avatarUrl: 'https://example.com/photo.jpg',
        },
        create: {
          email: 'test@example.com',
          googleId: 'google-123',
          name: 'Test User',
          avatarUrl: 'https://example.com/photo.jpg',
        },
      })
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
      })
      expect(result).toEqual({
        accessToken: 'jwt-token',
        expiresInMs: 86400000,
      })
    })
  })

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        avatarUrl: null,
        createdAt: new Date(),
      }
      prisma.client.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.getProfile('user-1')

      expect(prisma.client.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
        },
      })
      expect(result).toEqual(mockUser)
    })

    it('should throw UnauthorizedException when user not found', async () => {
      prisma.client.user.findUnique.mockResolvedValue(null)

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        'User no longer exists',
      )
    })
  })
})
