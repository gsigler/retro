# API Source Files

All files under `apps/api/src/`. Use `.js` extensions for local imports (ESM). Replace `<project>` with the actual project name.

---

## src/main.ts

```typescript
import * as Sentry from '@sentry/nestjs'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { ZodValidationPipe } from 'nestjs-zod'
import { AppModule } from './app.module.js'

async function bootstrap() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN })
  }

  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  app.enableCors({
    origin: configService.get<string>('APP_URL', 'http://localhost:5173'),
  })
  app.useGlobalPipes(new ZodValidationPipe())
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
```

---

## src/app.module.ts

```typescript
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { SentryModule } from '@sentry/nestjs/setup'
import { APP_GUARD } from '@nestjs/core'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { PrismaModule } from './prisma/prisma.module.js'
import { AuthModule } from './auth/auth.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    SentryModule.forRoot(),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
```

---

## src/app.controller.ts

```typescript
import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service.js'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth() {
    return this.appService.getHealth()
  }
}
```

---

## src/app.service.ts

```typescript
import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHealth() {
    return { status: 'ok' }
  }
}
```

---

## src/prisma/prisma.module.ts

```typescript
import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service.js'

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## src/prisma/prisma.service.ts

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '../../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private _client!: PrismaClient

  get client(): PrismaClient {
    return this._client
  }

  async onModuleInit() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    })

    this._client = new PrismaClient({ adapter })
    await this._client.$connect()
  }

  async onModuleDestroy() {
    await this._client?.$disconnect()
  }
}
```

---

## src/auth/auth.module.ts

```typescript
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { GoogleStrategy } from './strategies/google.strategy.js'
import { JwtStrategy } from './strategies/jwt.strategy.js'

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRATION', '7d') as string &
            import('ms').StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## src/auth/auth.service.ts

```typescript
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../prisma/prisma.service.js'

interface GoogleProfile {
  googleId: string
  email: string
  name: string
  avatarUrl?: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async findOrCreateGoogleUser(
    profile: GoogleProfile,
  ): Promise<{ accessToken: string }> {
    const user = await this.prisma.client.user.upsert({
      where: { email: profile.email },
      update: {
        googleId: profile.googleId,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
      create: {
        email: profile.email,
        googleId: profile.googleId,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
    })

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    })

    return { accessToken }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    })
    return user
  }
}
```

---

## src/auth/auth.controller.ts

```typescript
import { Controller, Get, Request, Res, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Response } from 'express'
import { AuthService } from './auth.service.js'
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
```

---

## src/auth/guards/jwt-auth.guard.ts

```typescript
import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

---

## src/auth/guards/google-auth.guard.ts

```typescript
import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
```

---

## src/auth/strategies/jwt.strategy.ts

```typescript
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

interface JwtPayload {
  sub: string
  email: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    })
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email }
  }
}
```

---

## src/auth/strategies/google.strategy.ts

```typescript
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3000/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    })
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    done(null, {
      googleId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      name: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    })
  }
}
```

---

## src/auth/dto/example.dto.ts

Example Zod DTO demonstrating the pattern (replace class-validator):

```typescript
import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export class LoginDto extends createZodDto(loginSchema) {}
```

---

## Test files

### src/app.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'

describe('AppController', () => {
  let controller: AppController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    controller = module.get<AppController>(AppController)
  })

  it('should return health status', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok' })
  })
})
```

### src/auth/auth.service.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { AuthService } from './auth.service.js'
import { PrismaService } from '../prisma/prisma.service.js'

describe('AuthService', () => {
  let service: AuthService
  let prisma: { client: { user: { upsert: jest.Mock; findUniqueOrThrow: jest.Mock } } }
  let jwtService: { sign: jest.Mock }

  beforeEach(async () => {
    prisma = {
      client: {
        user: {
          upsert: jest.fn(),
          findUniqueOrThrow: jest.fn(),
        },
      },
    }
    jwtService = { sign: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('findOrCreateGoogleUser', () => {
    it('should upsert user and return access token', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      prisma.client.user.upsert.mockResolvedValue(mockUser)
      jwtService.sign.mockReturnValue('mock-token')

      const result = await service.findOrCreateGoogleUser({
        googleId: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
      })

      expect(result).toEqual({ accessToken: 'mock-token' })
      expect(prisma.client.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'test@example.com' } }),
      )
    })
  })

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        avatarUrl: null,
        createdAt: new Date(),
      }
      prisma.client.user.findUniqueOrThrow.mockResolvedValue(mockProfile)

      const result = await service.getProfile('user-1')

      expect(result).toEqual(mockProfile)
    })
  })
})
```

### src/auth/auth.controller.spec.ts

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'

describe('AuthController', () => {
  let controller: AuthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            findOrCreateGoogleUser: jest.fn(),
            getProfile: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:5173') },
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should have getProfile method', () => {
    expect(controller.getProfile).toBeDefined()
  })
})
```
