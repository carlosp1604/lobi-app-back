import { LoggerMetaData, LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'

export class LoggerServiceMock implements LoggerServiceInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  debug(_message: string, _metadata?: LoggerMetaData): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(_message: string, _trace?: string, _metadata?: LoggerMetaData): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  log(_message: string, _metadata?: LoggerMetaData): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(_message: string, _metadata?: LoggerMetaData): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(_message: string, _metadata?: LoggerMetaData): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verbose(_message: string, _metadata?: LoggerMetaData): void {}
}
