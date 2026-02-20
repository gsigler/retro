import { Module } from '@nestjs/common'
import { RetrosController } from './retros.controller.js'
import { RetrosService } from './retros.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'

@Module({
  imports: [PrismaModule],
  controllers: [RetrosController],
  providers: [RetrosService],
  exports: [RetrosService],
})
export class RetrosModule {}
