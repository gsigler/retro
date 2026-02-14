import { Controller, Get, Request, Res, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Response } from 'express'
import { AuthService } from './auth.service'
import { GoogleAuthGuard } from './guards/google-auth.guard'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Guard initiates the Google OAuth redirect
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Request()
    req: {
      user: {
        googleId: string
        email: string
        name: string
        avatarUrl?: string
      }
    },
    @Res() res: Response,
  ) {
    const { accessToken } = await this.authService.findOrCreateGoogleUser(
      req.user,
    )
    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:5173',
    )
    res.redirect(`${appUrl}/auth/callback?token=${accessToken}`)
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: { user: { id: string; email: string } }) {
    return this.authService.getProfile(req.user.id)
  }
}
