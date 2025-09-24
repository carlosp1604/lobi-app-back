import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { Injectable } from '@nestjs/common'

@Injectable()
export class NodeClockService implements ClockServiceInterface {
  /**
   * Returns the current date and time
   * @returns the current Date
   */
  public now(): Date {
    return new Date()
  }
}
