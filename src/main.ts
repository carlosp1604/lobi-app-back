import * as Sentry from '@sentry/node'
import helmet from '@fastify/helmet'
import compress from '@fastify/compress'
import { env } from '~/src/shared/Infrastructure/EnvHelper'
import { validationPipe } from '~/src/shared/Infrastructure/GlobalValidationPipe'
import { SentryExceptionFilter } from '~/src/shared/Infrastructure/SentryExceptionFilter'
import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { buildFastifyApplication } from '~/src/shared/Infrastructure/FastifyApplication'
import { LOGGER_SERVICE_INTERFACE, LoggerServiceInterface } from '~/src/shared/Domain/LoggerServiceInterface'

/**
 * This project provides only an API | CSP = off
 * Consider add CSP directives if necessary
 */
async function setUpHelmet(app: NestFastifyApplication): Promise<void> {
  await app.register(helmet, {
    contentSecurityPolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
    noSniff: true,
    dnsPrefetchControl: { allow: false },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    hsts: env.isProduction ? { maxAge: 15552000 } : false,
  })
}

function setUpSentry() {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENV,
    release: env.SENTRY_RELEASE,
  })
}

async function bootstrap() {
  setUpSentry()

  const app = await buildFastifyApplication()

  const logger = app.get<LoggerServiceInterface>(LOGGER_SERVICE_INTERFACE)

  app.useLogger(logger)
  app.useGlobalFilters(app.get(SentryExceptionFilter))
  app.useGlobalPipes(validationPipe)

  await setUpHelmet(app)
  await app.register(compress, { global: true })

  await app.listen(env.PORT)
}

void bootstrap()
