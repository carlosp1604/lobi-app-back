import { LoggerMetaData, LoggerServiceInterface } from '~/src/shared/Domain/LoggerServiceInterface'
import { Injectable, Scope } from '@nestjs/common'
import type { Logger } from 'pino'

@Injectable({ scope: Scope.REQUEST })
export class PinoLoggerService implements LoggerServiceInterface {
  constructor(private readonly pino: Logger) {}

  /**
   * Logs a debug message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  public debug(message: string, metadata?: LoggerMetaData): void {
    this.pino.debug(metadata ?? {}, message)
  }

  /**
   * Logs an error message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param trace The stack trace or error trace associated with the event
   * @param metadata Additional structured information to enrich the log context
   */
  public error(message: string, trace?: string, metadata?: LoggerMetaData): void {
    this.pino.error(
      {
        ...(metadata ?? {}),
        ...(trace ? { trace } : {}),
      },
      message,
    )
  }

  /**
   * Logs a log message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  public log(message: string, metadata?: LoggerMetaData): void {
    this.pino.info(metadata ?? {}, message)
  }

  /**
   * Logs an info message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  public info(message: string, metadata?: LoggerMetaData): void {
    this.pino.info(metadata ?? {}, message)
  }

  /**
   * Logs a warn message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  public warn(message: string, metadata?: LoggerMetaData): void {
    this.pino.warn(metadata ?? {}, message)
  }

  /**
   * Logs a verbose message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  public verbose(message: string, metadata?: LoggerMetaData): void {
    this.pino.trace(metadata ?? {}, message)
  }
}
