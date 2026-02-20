import { LoggerServiceInterface } from './LoggerServiceInterface'

export interface LoggerFactoryInterface {
  createLogger(context: string): LoggerServiceInterface
}
