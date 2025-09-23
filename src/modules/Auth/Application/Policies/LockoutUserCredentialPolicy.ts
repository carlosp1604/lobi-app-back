import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'

export class LockoutPolicy {
  constructor(private readonly clock: ClockServiceInterface) {}

  public evaluateLock(credential: UserCredential): Date | null {
    const attempts = credential.failedAttempts

    if (attempts < 5) {
      return null
    }

    const now = this.clock.now()

    if (attempts < 10) {
      return new Date(now.getTime() + 1 * 60 * 1000)
    }

    if (attempts < 15) {
      return new Date(now.getTime() + 5 * 60 * 1000)
    }

    if (attempts < 20) {
      return new Date(now.getTime() + 30 * 60 * 1000)
    }

    return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }
}
