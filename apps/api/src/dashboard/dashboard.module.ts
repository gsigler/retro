import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { DashboardController } from './dashboard.controller.js'
import { DashboardService } from './dashboard.service.js'
import { DashboardGateway } from './dashboard.gateway.js'
import { PrismaModule } from '../prisma/prisma.module.js'

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardGateway],
  exports: [DashboardGateway],
})
export class DashboardModule {}
