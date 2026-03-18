import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'

describe('UserName', () => {
  describe('fromString', () => {
    const validUserNames = Array.from({ length: 100 }, () => UserNameMother.randomString())

    it.each(validUserNames)('should not throw error when user name is valid: %s', (validUserName) => {
      expect(() => UserName.fromString(validUserName)).not.toThrow()
    })

    it.each(UserNameMother.INVALID_FORMAT_CASES)('should throw error when user name is not valid: %s', (userName) => {
      expect(() => UserName.fromString(userName)).toThrow(UserDomainException.invalidUserName())
    })
  })

  describe('safeCreate', () => {
    const validUserNames = Array.from({ length: 100 }, () => UserNameMother.randomString())

    it.each(validUserNames)('should return success when user name is valid: %s', (validUserName) => {
      const result = UserName.safeCreate(validUserName)

      expect(result.success).toEqual(true)
    })

    it.each(UserNameMother.INVALID_FORMAT_CASES)('should return error when user name is not valid: %s', (userName) => {
      const result = UserName.safeCreate(userName)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(UserDomainException.invalidUserName())
    })
  })

  it('should store the correct value', () => {
    const validValue = UserNameMother.valid().value
    const userNameValueObject = UserName.fromString(validValue)

    expect(userNameValueObject.value).toBe(validValue)
  })
})
