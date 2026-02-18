import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import type { Logger } from 'pino'
import { ClsService } from 'nestjs-cls'
import { ContextClsStore } from '~/src/modules/Shared/Infrastructure/ContextClsStore'

export class PinoLoggerService implements LoggerServiceInterface {
  constructor(
    private readonly pino: Logger,
    private readonly cls: ClsService<ContextClsStore>,
  ) {}

  /**
   * Logs a debug message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  public debug(message: string, ...metadata: any[]): void {
    this.pino.debug(this.resolveContext(metadata), message)
  }

  /**
   * Logs an error message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param trace The stack trace or error trace associated with the event
   * @param metadata Additional structured information to enrich the log context
   */
  public error(message: string, trace?: string, ...metadata: any[]): void {
    const context = this.resolveContext(metadata)

    if (trace) {
      context.trace = trace
    }

    this.pino.error(context, message)
  }

  /**
   * Logs a log message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  public log(message: string, ...metadata: any[]): void {
    this.pino.info(this.resolveContext(metadata), message)
  }

  /**
   * Logs an info message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  public info(message: string, ...metadata: any[]): void {
    this.pino.info(this.resolveContext(metadata), message)
  }

  /**
   * Logs a warn message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  public warn(message: string, ...metadata: any[]): void {
    this.pino.warn(this.resolveContext(metadata), message)
  }

  /**
   * Logs a verbose message along with optional metadata.
   *
   * @param message Descriptive text of the event or state to be logged
   * @param metadata Additional structured information to enrich the log context
   */
  public verbose(message: string, ...metadata: any[]): void {
    this.pino.trace(this.resolveContext(metadata), message)
  }

  private resolveContext(params: any[]): Record<string, unknown> {
    const requestId = this.cls.get('requestId')
    const ip = this.cls.get('ip')
    const ua = this.cls.get('ua')

    const requestContext = requestId || ip || ua ? { requestId, ip, ua } : undefined

    let finalMetadata: Record<string, unknown> = {}

    if (requestContext) {
      finalMetadata.requestContext = requestContext
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const args = [...params]

    if (args.length > 0 && typeof args[args.length - 1] === 'string') {
      finalMetadata.context = args.pop()
    }

    args.forEach((arg) => {
      if (typeof arg === 'object' && arg !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        finalMetadata = { ...finalMetadata, ...arg }
      }
    })

    return finalMetadata
  }
}
