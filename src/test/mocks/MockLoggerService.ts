import { LoggerMetaData, LoggerServiceInterface } from '~/src/shared/Domain/LoggerServiceInterface'
/* eslint-disable @typescript-eslint/no-unused-vars */

export class MockLoggerService implements LoggerServiceInterface {
  log(_message: string, _metadata?: LoggerMetaData): void {}

  error(_message: string, _trace?: string, _metadata?: LoggerMetaData): void {}

  warn(_message: string, _metadata?: LoggerMetaData): void {}

  debug(_message: string, _metadata?: LoggerMetaData): void {}

  info(_message: string, _metadata?: LoggerMetaData): void {}

  verbose(_message: string, _metadata?: LoggerMetaData): void {}
}
