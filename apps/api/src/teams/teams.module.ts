import { Module } from '@nestjs/common'
import { nanoid } from 'nanoid'
import { TeamsController } from './teams.controller.js'
import { TeamsService, NANOID } from './teams.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'

@Module({
  imports: [PrismaModule],
  controllers: [TeamsController],
  providers: [
    TeamsService,
    {
      provide: NANOID,
      useValue: nanoid,
    },
  ],
  exports: [TeamsService],
})
export class TeamsModule {}
