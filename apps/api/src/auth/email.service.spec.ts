import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { EmailService } from './email.service'

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: jest.fn().mockResolvedValue({ id: 'email-1' }) },
  })),
}))

describe('EmailService', () => {
  describe('dev mode (no RESEND_API_KEY)', () => {
    let service: EmailService
    let logSpy: jest.SpyInstance

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, string | undefined> = {
                  RESEND_API_KEY: undefined,
                  FROM_EMAIL: undefined,
                  APP_URL: 'http://localhost:5173',
                }
                return config[key]
              }),
            },
          },
        ],
      }).compile()

      service = module.get<EmailService>(EmailService)
      logSpy = jest.spyOn((service as any).logger, 'log')
    })

    it('should log magic link to console', async () => {
      await service.sendMagicLink('test@example.com', 'abc-token')

      expect(logSpy).toHaveBeenCalledWith(
        '[DEV] Magic link for test@example.com: http://localhost:5173/auth/verify?token=abc-token',
      )
    })
  })

  describe('production mode (with RESEND_API_KEY)', () => {
    let service: EmailService
    let resendSend: jest.Mock

    beforeEach(async () => {
      const { Resend } = jest.requireMock('resend')
      Resend.mockClear()

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config: Record<string, string> = {
                  RESEND_API_KEY: 're_test_key',
                  FROM_EMAIL: 'hello@retro.app',
                  APP_URL: 'https://retro.app',
                }
                return config[key]
              }),
            },
          },
        ],
      }).compile()

      service = module.get<EmailService>(EmailService)
      resendSend = (service as any).resend.emails.send
    })

    it('should send email via Resend with correct parameters', async () => {
      await service.sendMagicLink('user@example.com', 'xyz-token')

      expect(resendSend).toHaveBeenCalledWith({
        from: 'hello@retro.app',
        to: 'user@example.com',
        subject: 'Your sign-in link for Retro',
        html: '<p>Click <a href="https://retro.app/auth/verify?token=xyz-token">here</a> to sign in. This link expires in 15 minutes.</p>',
      })
    })
  })
})
