import { Module } from '@nestjs/common'
import { RetrosController } from './retros.controller.js'
import { RetrosService } from './retros.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'
import { BoardModule } from '../board/board.module.js'

@Module({
  imports: [PrismaModule, BoardModule],
  controllers: [RetrosController],
  providers: [RetrosService],
  exports: [RetrosService],
})
export class RetrosModule {}
