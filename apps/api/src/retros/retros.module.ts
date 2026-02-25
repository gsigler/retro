import { Module } from '@nestjs/common'
import { RetrosController } from './retros.controller.js'
import { RetrosService } from './retros.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'
import { BoardModule } from '../board/board.module.js'
import { DashboardModule } from '../dashboard/dashboard.module.js'

@Module({
  imports: [PrismaModule, BoardModule, DashboardModule],
  controllers: [RetrosController],
  providers: [RetrosService],
  exports: [RetrosService],
})
export class RetrosModule {}
