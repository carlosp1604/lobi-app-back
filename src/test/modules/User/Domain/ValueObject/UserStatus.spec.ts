import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { UserStatus, ValidUserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'

const validUserStatus: Array<ValidUserStatus> = Object.values(ValidUserStatus)

const invalidCases = ['', 'random-status', '1111', 'ACTIVATED', 'ACTIVe', 'active ', 'suspended']

describe('UserStatus', () => {
  describe('constructor', () => {
    it.each(validUserStatus)('should not throw error when user status is valid: %s', (userStatus) => {
      expect(() => UserStatus.fromString(String(userStatus))).not.toThrow()
    })

    it.each(invalidCases)('should throw error when user status is not valid: %s', (userStatus) => {
      expect(() => UserStatus.fromString(userStatus)).toThrow(UserDomainException.invalidUserStatus(userStatus))
    })
  })

  describe('get value', () => {
    it('should store the correct value', () => {
      const userStatusValueObject = UserStatus.fromString(ValidUserStatus.ACTIVE)

      expect(userStatusValueObject.value).toBe(ValidUserStatus.ACTIVE)
    })
  })

  describe('active', () => {
    it('factory should return active', () => {
      const userStatusValueObject = UserStatus.active()

      expect(userStatusValueObject.value).toBe(ValidUserStatus.ACTIVE)
    })
  })

  describe('deactivated', () => {
    it('factory should return deactivated', () => {
      const userStatusValueObject = UserStatus.deactivated()

      expect(userStatusValueObject.value).toBe(ValidUserStatus.DEACTIVATED)
    })
  })
})
