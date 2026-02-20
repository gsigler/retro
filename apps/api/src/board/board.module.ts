import { Module } from '@nestjs/common'
import { BoardController } from './board.controller'
import { BoardService } from './board.service'
import { BoardGateway } from './board.gateway'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [BoardController],
  providers: [BoardService, BoardGateway],
  exports: [BoardService],
})
export class BoardModule {}
