import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { getDatabaseConfig } from '~/src/config'

async function bootstrap() {
  // Load database ENV variables
  getDatabaseConfig()

  const app = await NestFactory.create(AppModule)
  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
