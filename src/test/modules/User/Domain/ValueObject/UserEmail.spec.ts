import fc from 'fast-check'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'

describe('UserEmail', () => {
  describe('fromString', () => {
    it('should not throw error when email is valid', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (validUserEmail) => {
          expect(() => UserEmail.fromString(validUserEmail)).not.toThrow()
        }),
      )
    })

    it.each(UserPasswordMother.INVALID_FORMAT_CASES)('should throw error when email is not valid: %s', (invalidEmail) => {
      expect(() => UserEmail.fromString(invalidEmail)).toThrow(UserDomainException.invalidUserEmail(invalidEmail))
    })
  })

  describe('safeCreate', () => {
    it('should return success when email is valid', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (validUserEmail) => {
          const result = UserEmail.safeCreate(validUserEmail)

          expect(result.success).toBe(true)
        }),
      )
    })

    it.each(UserPasswordMother.INVALID_FORMAT_CASES)('should return error when email is not valid: %s', (invalidEmail) => {
      const result = UserEmail.safeCreate(invalidEmail)

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(UserDomainException.invalidUserEmail(invalidEmail))
    })
  })

  it('should store the correct value', () => {
    const validValue = UserEmailMother.valid().toString()
    const emailValueObject = UserEmail.fromString(validValue)

    expect(emailValueObject.value).toEqual(validValue)
  })
})
