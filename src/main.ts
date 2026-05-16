import * as Sentry from '@sentry/node'
import helmet from '@fastify/helmet'
import compress from '@fastify/compress'
import fastifyCookie from '@fastify/cookie'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { NestFastifyApplication } from '@nestjs/platform-fastify'
import { buildFastifyApplication } from '~/src/modules/Shared/Infrastructure/FastifyApplication'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { LOGGER_FACTORY } from '~/src/modules/Shared/Infrastructure/logger.module'
import { validationPipe } from '~/src/modules/Shared/Infrastructure/global-validation.pipe'
import { SentryExceptionFilter } from '~/src/modules/Shared/Infrastructure/sentry-exception.filter'
import { LoggerFactoryInterface } from '~/src/modules/Shared/Domain/LoggerFactoryInterface'

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

function setUpSwagger(app: NestFastifyApplication): void {
  const config = new DocumentBuilder()
    .setTitle(env.API_DOCS_TITLE)
    .setDescription(env.API_DOCS_DESCRIPTION)
    .setVersion(env.API_DOCS_VERSION)
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, documentFactory)
}

async function bootstrap() {
  setUpSentry()

  const app = await buildFastifyApplication()

  const loggerFactory = await app.resolve<LoggerFactoryInterface>(LOGGER_FACTORY)

  const logger = loggerFactory.createLogger('NestApplication')

  app.useLogger(logger)
  app.useGlobalFilters(app.get(SentryExceptionFilter))
  app.useGlobalPipes(validationPipe)

  await setUpHelmet(app)
  await app.register(compress, { global: true })
  await app.register(fastifyCookie, { secret: env.COOKIE_SECRET })
  setUpSwagger(app)

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

void bootstrap()
