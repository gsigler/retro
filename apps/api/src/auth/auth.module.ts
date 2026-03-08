import { Module, type Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule } from '@nestjs/config'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { GoogleStrategy } from './strategies/google.strategy.js'
import { JwtStrategy } from './strategies/jwt.strategy.js'

const railwayEnv = process.env.RAILWAY_ENVIRONMENT_NAME || ''
const isRailwayPR = railwayEnv !== '' && railwayEnv !== 'production'
const authMode = process.env.AUTH_MODE || (isRailwayPR ? 'dev' : 'google')

const providers: Provider[] = [AuthService, JwtStrategy]
if (authMode === 'google') {
  providers.push(GoogleStrategy)
}

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRATION', '24h'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers,
  exports: [AuthService],
})
export class AuthModule {}
