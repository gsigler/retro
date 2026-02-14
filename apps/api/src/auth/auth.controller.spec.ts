import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

describe('AuthController', () => {
  let controller: AuthController
  let authService: {
    sendMagicLink: jest.Mock
    verifyMagicLink: jest.Mock
    getProfile: jest.Mock
  }

  beforeEach(async () => {
    authService = {
      sendMagicLink: jest.fn(),
      verifyMagicLink: jest.fn(),
      getProfile: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  describe('sendMagicLink', () => {
    it('should call authService.sendMagicLink with email', async () => {
      const response = {
        message: 'If an account exists, a magic link has been sent.',
      }
      authService.sendMagicLink.mockResolvedValue(response)

      const result = await controller.sendMagicLink({
        email: 'test@example.com',
      })

      expect(authService.sendMagicLink).toHaveBeenCalledWith('test@example.com')
      expect(result).toEqual(response)
    })
  })

  describe('verify', () => {
    it('should call authService.verifyMagicLink with token', async () => {
      const response = { accessToken: 'jwt-token' }
      authService.verifyMagicLink.mockResolvedValue(response)

      const result = await controller.verify({ token: 'some-token' })

      expect(authService.verifyMagicLink).toHaveBeenCalledWith('some-token')
      expect(result).toEqual(response)
    })
  })

  describe('getProfile', () => {
    it('should call authService.getProfile with user id from request', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
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
