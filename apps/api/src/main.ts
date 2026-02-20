import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  app.enableCors({
    origin: configService.get<string>('APP_URL', 'http://localhost:5173'),
  })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
