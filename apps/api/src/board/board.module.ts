import { Module } from '@nestjs/common'
import { BoardController } from './board.controller.js'
import { BoardService } from './board.service.js'
import { BoardGateway } from './board.gateway.js'
import { PrismaModule } from '../prisma/prisma.module.js'

@Module({
  imports: [PrismaModule],
  controllers: [BoardController],
  providers: [BoardService, BoardGateway],
  exports: [BoardService, BoardGateway],
})
export class BoardModule {}
