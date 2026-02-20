import pino, { Logger } from 'pino'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { ClsService } from 'nestjs-cls'
import { Global, Module } from '@nestjs/common'
import { ContextClsStore } from '~/src/modules/Shared/Infrastructure/ContextClsStore'
import { PinoLoggerService } from '~/src/modules/Shared/Infrastructure/Services/PinoLoggerService'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { LoggerFactoryInterface } from '~/src/modules/Shared/Domain/LoggerFactoryInterface'

export const PINO_LOGGER = 'PINO_LOGGER'
export const LOGGER_FACTORY = 'LOGGER_FACTORY'

@Global()
@Module({
  providers: [
    {
      provide: PINO_LOGGER,
      useFactory: (): Logger =>
        pino({
          level: env.isProduction ? 'info' : env.isTesting ? 'silent' : 'debug',
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
      provide: LOGGER_FACTORY,
      useFactory: (base: Logger, clsService: ClsService<ContextClsStore>): LoggerFactoryInterface => {
        return {
          createLogger: (context: string): LoggerServiceInterface => {
            return new PinoLoggerService(base, clsService, context)
          },
        }
      },
      inject: [PINO_LOGGER, ClsService],
    },
  ],
  exports: [LOGGER_FACTORY],
})
export class LoggerModule {}
