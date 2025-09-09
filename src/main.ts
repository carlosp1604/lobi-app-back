import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { getDatabaseConfig } from '~/src/config'
import { LOGGER_SERVICE_INTERFACE, LoggerServiceInterface } from '~/src/shared/Domain/LoggerServiceInterface'
import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { fastifyAdapter } from '~/src/shared/Infrastructure/FastifyAdapter'

async function bootstrap() {
  // Load database ENV variables
  getDatabaseConfig()

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter)

  const logger = app.get<LoggerServiceInterface>(LOGGER_SERVICE_INTERFACE)

  app.useLogger(logger)

  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
