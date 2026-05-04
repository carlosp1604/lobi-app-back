import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { ValidUserStatuses } from '~/src/modules/Shared/Domain/ValidUserStatuses'

const validUserStatus: Array<ValidUserStatuses> = Object.values(ValidUserStatuses)

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
      const userStatusValueObject = UserStatus.fromString(ValidUserStatuses.ACTIVE)

      expect(userStatusValueObject.value).toBe(ValidUserStatuses.ACTIVE)
    })
  })

  describe('active', () => {
    it('factory should return active', () => {
      const userStatusValueObject = UserStatus.active()

      expect(userStatusValueObject.value).toBe(ValidUserStatuses.ACTIVE)
    })
  })

  describe('deactivated', () => {
    it('factory should return deactivated', () => {
      const userStatusValueObject = UserStatus.deactivated()

      expect(userStatusValueObject.value).toBe(ValidUserStatuses.DEACTIVATED)
    })
  })
})
