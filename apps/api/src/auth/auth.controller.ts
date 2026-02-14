import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { SendMagicLinkDto } from './dto/send-magic-link.dto'
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('magic-link')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  sendMagicLink(@Body() dto: SendMagicLinkDto) {
    return this.authService.sendMagicLink(dto.email)
  }

  @Post('verify')
  verify(@Body() dto: VerifyMagicLinkDto) {
    return this.authService.verifyMagicLink(dto.token)
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: { user: { id: string; email: string } }) {
    return this.authService.getProfile(req.user.id)
  }
}
