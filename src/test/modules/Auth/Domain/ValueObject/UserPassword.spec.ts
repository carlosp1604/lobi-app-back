import { UserPassword } from '~/src/modules/Auth/Domain/ValueObject/UserPassword'
import { UserPasswordMother } from '~/src/test/mothers/UserPasswordMother'
import { UserCredentialDomainException } from '~/src/modules/Auth/Domain/UserCredentialDomainException'

describe('UserPassword', () => {
  it('should not throw error when password format is valid', () => {
    const validPasswords = Array.from({ length: 100 }, () => UserPasswordMother.random().value)

    validPasswords.forEach((validPassword) => {
      expect(() => UserPassword.fromString(validPassword)).not.toThrow()
    })
  })

  it.each(UserPasswordMother.INVALID_FORMAT_CASES)('should throw error when password format is not valid: "%s"', (invalidPassword) => {
    expect(() => UserPassword.fromString(invalidPassword)).toThrow(UserCredentialDomainException.invalidPasswordFormat())
  })

  it('should store the correct value', () => {
    const validValue = UserPasswordMother.valid().value
    const userPasswordValueObject = UserPassword.fromString(validValue)

    expect(userPasswordValueObject.value).toEqual(validValue)
  })
})
