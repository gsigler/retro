import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Response } from 'express'
import { AuthService } from './auth.service.js'
import { TestLoginDto } from './dto/test-login.dto.js'
import { GoogleAuthGuard } from './guards/google-auth.guard.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'

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
    const { accessToken, expiresInMs } =
      await this.authService.findOrCreateGoogleUser(req.user)
    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:5173',
    )
    const isProduction = this.configService.get('NODE_ENV') === 'production'

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: expiresInMs,
    })

    res.redirect(`${appUrl}/auth/callback`)
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: { user: { id: string; email: string } }) {
    return this.authService.getProfile(req.user.id)
  }

  @Post('logout')
  logout(@Res() res: Response) {
    const isProduction = this.configService.get('NODE_ENV') === 'production'
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    })
    res.json({ message: 'Logged out' })
  }

  @Post('test-login')
  async testLogin(@Body() dto: TestLoginDto, @Res() res: Response) {
    if (!this.configService.get('E2E_TEST_MODE')) {
      throw new NotFoundException()
    }

    const { accessToken, expiresInMs } =
      await this.authService.findOrCreateGoogleUser({
        googleId: `test-${dto.email}`,
        email: dto.email,
        name: dto.name ?? 'E2E Test User',
      })

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: expiresInMs,
    })

    res.json({ message: 'ok' })
  }
}
