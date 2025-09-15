import { UserDomainException } from '~/src/modules/Users/Domain/UserDomainException'
import { UserStatus, ValidUserStatus } from '~/src/modules/Users/Domain/ValueObject/UserStatus'

const validUserStatus: Array<ValidUserStatus> = Object.values(ValidUserStatus)

const invalidCases = ['', 'random-status', '1111', 'ACTIVATED', 'active ', 'suspended']

describe('UserStatus', () => {
  it.each(validUserStatus)('should not throw error when user status is valid: %s', (userStatus) => {
    expect(() => UserStatus.fromString(String(userStatus))).not.toThrow()
  })

  it.each(invalidCases)('should throw error when user status is not valid: %s', (userStatus) => {
    expect(() => UserStatus.fromString(userStatus)).toThrow(UserDomainException.invalidUserStatus(userStatus))
  })

  it('should store the correct value', () => {
    const userStatusValueObject = UserStatus.fromString(ValidUserStatus.ACTIVE)

    expect(userStatusValueObject.value).toEqual(ValidUserStatus.ACTIVE)
  })
})
