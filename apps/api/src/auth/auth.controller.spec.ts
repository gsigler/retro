import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'

describe('AuthController', () => {
  let controller: AuthController
  let authService: {
    findOrCreateGoogleUser: jest.Mock
    getProfile: jest.Mock
  }

  beforeEach(async () => {
    authService = {
      findOrCreateGoogleUser: jest.fn(),
      getProfile: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'APP_URL') return 'http://localhost:5173'
              if (key === 'NODE_ENV') return 'test'
              return undefined
            }),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  describe('googleLogin', () => {
    it('should be defined (guard handles redirect)', () => {
      expect(controller.googleLogin).toBeDefined()
    })
  })

  describe('googleCallback', () => {
    it('should create user and set cookie then redirect', async () => {
      authService.findOrCreateGoogleUser.mockResolvedValue({
        accessToken: 'jwt-token',
        expiresInMs: 86400000,
      })
      const res = { cookie: jest.fn(), redirect: jest.fn() }

      await controller.googleCallback(
        {
          user: {
            googleId: 'google-123',
            email: 'test@example.com',
            name: 'Test User',
          },
        },
        res as any,
      )

      expect(authService.findOrCreateGoogleUser).toHaveBeenCalledWith({
        googleId: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
      })
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'jwt-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 86400000,
      })
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:5173/auth/callback',
      )
    })
  })

  describe('getProfile', () => {
    it('should call authService.getProfile with user id from request', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        avatarUrl: null,
        createdAt: new Date(),
      }
      authService.getProfile.mockResolvedValue(mockUser)

      const result = await controller.getProfile({
        user: { id: 'user-1', email: 'test@example.com' },
      })

      expect(authService.getProfile).toHaveBeenCalledWith('user-1')
      expect(result).toEqual(mockUser)
    })
  })

  describe('logout', () => {
    it('should clear the access_token cookie', () => {
      const res = { clearCookie: jest.fn(), json: jest.fn() }

      controller.logout(res as any)

      expect(res.clearCookie).toHaveBeenCalledWith('access_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      })
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out' })
    })
  })
})
