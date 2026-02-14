import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'

describe('UserUsername', () => {
  describe('fromString', () => {
    it('should not throw error when username is valid', () => {
      const validUserUsernames = Array.from({ length: 100 }, () => UserUsernameMother.randomString())

      validUserUsernames.forEach((validUserUsername) => {
        expect(() => UserUsername.fromString(validUserUsername)).not.toThrow()
      })
    })

    it.each(UserUsernameMother.INVALID_FORMAT_CASES)('should throw error when username is not valid: %s', (username) => {
      expect(() => UserUsername.fromString(username)).toThrow(UserDomainException.invalidUsername(username))
    })
  })

  describe('safeCreate', () => {
    it('should not return success when username is valid', () => {
      const validUserUsernames = Array.from({ length: 100 }, () => UserUsernameMother.random().value)

      validUserUsernames.forEach((validUserUsername) => {
        const result = UserUsername.safeCreate(validUserUsername)

        expect(result.success).toBe(true)
      })
    })

    it.each(UserUsernameMother.INVALID_FORMAT_CASES)('should return error when username is not valid: %s', (username) => {
      const result = UserUsername.safeCreate(username)

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(UserDomainException.invalidUsername(username))
    })
  })

  it('should store the correct value', () => {
    const validValue = UserUsernameMother.valid().toString()
    const usernameValueObject = UserUsername.fromString(validValue)

    expect(usernameValueObject.value).toEqual(validValue)
  })
})
