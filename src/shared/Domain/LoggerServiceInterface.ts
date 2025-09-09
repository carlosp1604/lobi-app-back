export type LoggerMetaData = Record<string, unknown>

export interface LoggerServiceInterface {
  /**
   * Logs a debug message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  debug(message: string, metadata?: LoggerMetaData): void

  /**
   * Logs an error message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param trace The stack trace or error trace associated with the event
   * @param metadata Additional structured information to enrich the log context
   */
  error(message: string, trace?: string, metadata?: LoggerMetaData): void

  /**
   * Logs a log message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  log(message: string, metadata?: LoggerMetaData): void

  /**
   * Logs an info message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  info(message: string, metadata?: LoggerMetaData): void

  /**
   * Logs a warn message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  warn(message: string, metadata?: LoggerMetaData): void

  /**
   * Logs a verbose message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  verbose(message: string, metadata?: LoggerMetaData): void
}

export const LOGGER_SERVICE_INTERFACE = Symbol('LOGGER_SERVICE_INTERFACE')
