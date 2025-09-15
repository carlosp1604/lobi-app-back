import { Module, Global } from '@nestjs/common'
import pino, { Logger } from 'pino'
import { PinoLoggerService } from '~/src/modules/shared/Infrastructure/Service/PinoLoggerService'
import { LOGGER_SERVICE_INTERFACE, LoggerServiceInterface } from '~/src/modules/shared/Domain/LoggerServiceInterface'
import { env } from '~/src/modules/shared/Infrastructure/EnvHelper'

export const PINO_LOGGER = 'PINO_LOGGER'

@Global()
@Module({
  providers: [
    {
      provide: PINO_LOGGER,
      useFactory: (): Logger =>
        pino({
          level: env.isProduction ? 'info' : 'debug',
          transport: env.isProduction
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                },
              },
        }),
    },
    {
      provide: LOGGER_SERVICE_INTERFACE,
      useFactory: (base: Logger): LoggerServiceInterface => new PinoLoggerService(base),
      inject: [PINO_LOGGER],
    },
  ],
  exports: [LOGGER_SERVICE_INTERFACE],
})
export class PinoLoggerModule {}
