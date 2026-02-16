import { Module } from '@nestjs/common'
import { RetrosController } from './retros.controller'
import { RetrosService } from './retros.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [RetrosController],
  providers: [RetrosService],
  exports: [RetrosService],
})
export class RetrosModule {}
