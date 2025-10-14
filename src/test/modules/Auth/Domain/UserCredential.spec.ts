import { UserCredentialTestBuilder } from '~/src/test/modules/Auth/Domain/UserCredentialTestBuilder'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { compareExceptModifiedFields } from '~/src/test/utils/snapshot'

interface UserCredentialSnapshot {
  userId: string
  passwordHash: string
  failedAttempts: number
  lockedUntil: Date | null
  lastLoginAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
}

describe('UserCredential', () => {
  const now = new Date('2025-09-26T10:17:38Z')

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useFakeTimers().setSystemTime(now)
  })

  const createSnapshot = (userCredential: UserCredential): UserCredentialSnapshot => {
    return {
      userId: userCredential.userId.toString(),
      passwordHash: userCredential.passwordHash.toString(),
      failedAttempts: userCredential.failedAttempts,
      lockedUntil: userCredential.lockedUntil,
      lastLoginAt: userCredential.lastLoginAt,
      createdAt: userCredential.createdAt,
      updatedAt: userCredential.updatedAt,
    }
  }

  describe('incrementFailedAttempts', () => {
    const updatedAt = new Date(now.getTime() + 15)

    it('should update failedAttempts and updatedAt correctly', () => {
      const userCredential = new UserCredentialTestBuilder().withFailedAttempts(0).build()

      const beforeSnapshot = createSnapshot(userCredential)

      userCredential.incrementFailedAttempts(updatedAt)

      const afterSnapshot = createSnapshot(userCredential)

      expect(userCredential.failedAttempts).toBe(1)
      expect(userCredential.updatedAt).toBe(updatedAt)
      compareExceptModifiedFields(beforeSnapshot, afterSnapshot, ['failedAttempts', 'updatedAt'])
    })

    it('should update failedAttempts and updatedAt correctly if failedAttempts is less than 0', () => {
      const userCredential = new UserCredentialTestBuilder().withFailedAttempts(-10).build()

      const beforeSnapshot = createSnapshot(userCredential)

      userCredential.incrementFailedAttempts(updatedAt)

      const afterSnapshot = createSnapshot(userCredential)

      expect(userCredential.failedAttempts).toBe(1)
      expect(userCredential.updatedAt).toBe(updatedAt)
      compareExceptModifiedFields(beforeSnapshot, afterSnapshot, ['failedAttempts', 'updatedAt'])
    })
  })

  describe('lock', () => {
    const updatedAt = new Date(now.getTime() + 15)

    it('should update lockUntil and updatedAt correctly', () => {
      const userCredential = new UserCredentialTestBuilder().withLockedUntil(null).build()

      const beforeSnapshot = createSnapshot(userCredential)

      const lockUntil = new Date(now.getTime() + 60)
      userCredential.lock(lockUntil, updatedAt)

      const afterSnapshot = createSnapshot(userCredential)

      expect(userCredential.lockedUntil).toBe(lockUntil)
      expect(userCredential.updatedAt).toBe(updatedAt)
      compareExceptModifiedFields(beforeSnapshot, afterSnapshot, ['lockedUntil', 'updatedAt'])
    })
  })

  describe('releaseLock', () => {
    const updatedAt = new Date(now.getTime() + 15)

    it('should update updatedAt and set lockedUntil to NULL correctly', () => {
      const userCredential = new UserCredentialTestBuilder().withLockedUntil(now).build()

      const beforeSnapshot = createSnapshot(userCredential)

      userCredential.releaseLock(updatedAt)

      const afterSnapshot = createSnapshot(userCredential)

      expect(userCredential.lockedUntil).toBeNull()
      expect(userCredential.updatedAt).toBe(updatedAt)
      compareExceptModifiedFields(beforeSnapshot, afterSnapshot, ['lockedUntil', 'updatedAt'])
    })
  })

  describe('resetAfterSuccessfulLogin', () => {
    const updatedAt = new Date(now.getTime() + 30)

    it('should reset status correctly', () => {
      const userCredential = new UserCredentialTestBuilder()
        .withLastLoginAt(null)
        .withLockedUntil(now)
        .withFailedAttempts(10)
        .withUpdatedAt(now)
        .build()

      const beforeSnapshot = createSnapshot(userCredential)

      userCredential.resetAfterSuccessfulLogin(updatedAt)

      const afterSnapshot = createSnapshot(userCredential)

      expect(userCredential.lockedUntil).toBe(null)
      expect(userCredential.updatedAt).toBe(updatedAt)
      expect(userCredential.failedAttempts).toBe(0)
      expect(userCredential.lastLoginAt).toBe(updatedAt)
      compareExceptModifiedFields(beforeSnapshot, afterSnapshot, ['lockedUntil', 'lastLoginAt', 'failedAttempts', 'updatedAt'])
    })
  })

  describe('isLocked', () => {
    it('should return true if lockedUntil is not NULL and is grater than current date', () => {
      const lockedUntil = new Date(now.getTime() + 120)
      const userCredential = new UserCredentialTestBuilder().withLockedUntil(lockedUntil).build()

      const result = userCredential.isLocked(now)

      expect(result).toBe(true)
    })

    it('should return false if lockedUntil is NULL', () => {
      const userCredential = new UserCredentialTestBuilder().withLockedUntil(null).build()

      const result = userCredential.isLocked(now)

      expect(result).toBe(false)
    })

    it('should return false if lockedUntil is not NULL but is less than current date', () => {
      const lockedUntil = new Date(now.getTime() - 120)
      const userCredential = new UserCredentialTestBuilder().withLockedUntil(lockedUntil).build()

      const result = userCredential.isLocked(now)

      expect(result).toBe(false)
    })
  })
})
