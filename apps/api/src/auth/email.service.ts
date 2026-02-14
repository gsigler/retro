import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly resend: Resend | null
  private readonly fromEmail: string
  private readonly appUrl: string

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY')
    this.resend = apiKey ? new Resend(apiKey) : null
    this.fromEmail =
      this.configService.get<string>('FROM_EMAIL') ?? 'noreply@example.com'
    this.appUrl =
      this.configService.get<string>('APP_URL') ?? 'http://localhost:5173'
  }

  async sendMagicLink(email: string, token: string): Promise<void> {
    const url = `${this.appUrl}/auth/verify?token=${token}`

    if (!this.resend) {
      this.logger.log(`[DEV] Magic link for ${email}: ${url}`)
      return
    }

    await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: 'Your sign-in link for Retro',
      html: `<p>Click <a href="${url}">here</a> to sign in. This link expires in 15 minutes.</p>`,
    })
  }
}
