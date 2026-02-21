import { Module } from '@nestjs/common'
import { ActionItemsController } from './action-items.controller.js'
import { ActionItemsService } from './action-items.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'
import { BoardModule } from '../board/board.module.js'

@Module({
  imports: [PrismaModule, BoardModule],
  controllers: [ActionItemsController],
  providers: [ActionItemsService],
  exports: [ActionItemsService],
})
export class ActionItemsModule {}
