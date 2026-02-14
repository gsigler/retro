import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

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
          useValue: { get: jest.fn().mockReturnValue('http://localhost:5173') },
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
    it('should create user and redirect with token', async () => {
      authService.findOrCreateGoogleUser.mockResolvedValue({
        accessToken: 'jwt-token',
      })
      const res = { redirect: jest.fn() }

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
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:5173/auth/callback?token=jwt-token',
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
})
