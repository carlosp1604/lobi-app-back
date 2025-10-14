import { LockoutUserCredentialPolicy } from '~/src/modules/Auth/Domain/Policies/LockoutUserCredentialPolicy'
import { UserCredentialTestBuilder } from '~/src/test/modules/Auth/Domain/UserCredentialTestBuilder'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'

describe('LockoutUserCredentialPolicy', () => {
  const policy = new LockoutUserCredentialPolicy()
  const now = new Date('2025-09-24T10:27:25Z')

  it('should return null if there are just 1-4 failed attempts', () => {
    const userCredential = new UserCredentialTestBuilder().withFailedAttempts(4).build()
    const lockedUntil = policy.evaluateLock(userCredential, now)

    expect(lockedUntil).toBeNull()
  })

  it('should return 1 min lock if there are 5-9 failed attempts', () => {
    const userCredential = new UserCredentialTestBuilder().withFailedAttempts(5).build()
    const lockedUntil = policy.evaluateLock(userCredential, now)

    expect(lockedUntil).toStrictEqual(new Date(now.getTime() + 1 * 60 * 1000))
  })

  it('should return 5 min lock if there are 10-14 failed attempts', () => {
    const userCredential = new UserCredentialTestBuilder().withFailedAttempts(10).build()
    const lockedUntil = policy.evaluateLock(userCredential, now)

    expect(lockedUntil).toStrictEqual(new Date(now.getTime() + 5 * 60 * 1000))
  })

  it('should return 30 min lock if there are 15-19 failed attempts', () => {
    const userCredential = new UserCredentialTestBuilder().withFailedAttempts(15).build()
    const lockedUntil = policy.evaluateLock(userCredential, now)

    expect(lockedUntil).toStrictEqual(new Date(now.getTime() + 30 * 60 * 1000))
  })

  it('should return 24h lock if there are more than 19 failed attempts', () => {
    const userCredential = new UserCredentialTestBuilder().withFailedAttempts(20).build()
    const lockedUntil = policy.evaluateLock(userCredential, now)

    expect(lockedUntil).toStrictEqual(new Date(now.getTime() + 24 * 60 * 60 * 1000))
  })

  it('should keep the highest lock (24h) there are more 20 o more failed attempts', () => {
    for (const failedAttempts of [20, 25, 30, 50, 100, 200]) {
      const userCredential = new UserCredentialTestBuilder().withFailedAttempts(failedAttempts).build()
      const lockedUntil = policy.evaluateLock(userCredential, now)

      expect(lockedUntil).toStrictEqual(new Date(now.getTime() + 24 * 60 * 60 * 1000))
    }
  })

  it('should not mutate the input user credential', () => {
    const userCredential = Object.freeze(new UserCredentialTestBuilder().withFailedAttempts(9).build()) as UserCredential
    const lockedUntil = policy.evaluateLock(userCredential, now)

    expect(lockedUntil).toBeInstanceOf(Date)
  })
})
