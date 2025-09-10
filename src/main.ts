import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { getDatabaseConfig } from '~/src/db/config'
import { LOGGER_SERVICE_INTERFACE, LoggerServiceInterface } from '~/src/shared/Domain/LoggerServiceInterface'
import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { fastifyAdapter } from '~/src/shared/Infrastructure/FastifyAdapter'
import * as Sentry from '@sentry/node'
import { SentryExceptionFilter } from '~/src/shared/Infrastructure/SentryExceptionFilter'
import { validationPipe } from '~/src/shared/Infrastructure/GlobalValidationPipe'

function setUpSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENV,
    release: process.env.SENTRY_RELEASE,
  })
}

async function bootstrap() {
  // Load database ENV variables
  getDatabaseConfig()

  setUpSentry()

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter)

  const logger = app.get<LoggerServiceInterface>(LOGGER_SERVICE_INTERFACE)

  app.useLogger(logger)
  app.useGlobalFilters(app.get(SentryExceptionFilter))
  app.useGlobalPipes(validationPipe)

  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
