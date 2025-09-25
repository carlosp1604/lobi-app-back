import { Global, Module, Scope } from '@nestjs/common'
import pino, { Logger } from 'pino'
import { PinoLoggerService } from '~/src/modules/Shared/Infrastructure/Services/PinoLoggerService'
import { LOGGER_SERVICE_INTERFACE, LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { env } from '~/src/modules/Shared/Infrastructure/EnvHelper'

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
      scope: Scope.REQUEST,
    },
  ],
  exports: [LOGGER_SERVICE_INTERFACE],
})
export class PinoLoggerModule {}
