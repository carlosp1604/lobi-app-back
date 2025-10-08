import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'

export class ClockServiceMock implements ClockServiceInterface {
  constructor(private readonly fixed: Date) {}
  now() {
    return this.fixed
  }
}
