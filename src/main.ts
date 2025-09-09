import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { getDatabaseConfig } from '~/src/config'
import { LOGGER_SERVICE_INTERFACE, LoggerServiceInterface } from '~/src/shared/Domain/LoggerServiceInterface'
import { HttpLogger } from 'pino-http'
import { PINO_HTTP } from '~/src/shared/Infrastructure/PinoLoggerModule'

async function bootstrap() {
  // Load database ENV variables
  getDatabaseConfig()

  const app = await NestFactory.create(AppModule)

  const logger = app.get<LoggerServiceInterface>(LOGGER_SERVICE_INTERFACE)
  const pinoHttp = app.get<HttpLogger>(PINO_HTTP)

  app.useLogger(logger)
  app.use(pinoHttp)

  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
