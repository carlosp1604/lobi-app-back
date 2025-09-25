import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'

export class LockoutUserCredentialPolicy {
  public evaluateLock(credential: UserCredential, now: Date): Date | null {
    const attempts = credential.failedAttempts

    if (attempts < 5) {
      return null
    }

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
