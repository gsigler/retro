import { Module } from '@nestjs/common'
import { TeamsController } from './teams.controller'
import { TeamsService, NANOID } from './teams.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [TeamsController],
  providers: [
    TeamsService,
    {
      provide: NANOID,
      useFactory: async () => {
        const { nanoid } = await import('nanoid')
        return nanoid
      },
    },
  ],
  exports: [TeamsService],
})
export class TeamsModule {}
