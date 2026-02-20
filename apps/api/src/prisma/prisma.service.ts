import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '../../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private _client!: PrismaClient

  get client(): PrismaClient {
    return this._client
  }

  async onModuleInit() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    })

    this._client = new PrismaClient({ adapter })
    await this._client.$connect()
  }

  async onModuleDestroy() {
    await this._client?.$disconnect()
  }
}
