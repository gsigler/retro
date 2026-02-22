import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { BoardController } from './board.controller.js'
import { BoardService } from './board.service.js'
import { BoardGateway } from './board.gateway.js'
import { TimerService } from './timer.service.js'
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
  controllers: [BoardController],
  providers: [BoardService, BoardGateway, TimerService],
  exports: [BoardService, BoardGateway],
})
export class BoardModule {}
