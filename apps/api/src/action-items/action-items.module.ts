import { Module } from '@nestjs/common'
import { ActionItemsController } from './action-items.controller.js'
import { ActionItemsService } from './action-items.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'

@Module({
  imports: [PrismaModule],
  controllers: [ActionItemsController],
  providers: [ActionItemsService],
  exports: [ActionItemsService],
})
export class ActionItemsModule {}
