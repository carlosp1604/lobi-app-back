import fc from 'fast-check'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'

const invalidCases: Array<string> = [
  '',
  'no-at-symbol',
  '@example.com',
  'user@',
  'user@example',
  'user example@example.com',
  'user@\nexample.com',
  `${'a'.repeat(65)}@example.com`,
  `u${'a'.repeat(310)}@example.com`,
]

describe('UserEmail', () => {
  it('should not throw error when email is valid', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (emailAddress) => {
        expect(() => UserEmail.fromString(emailAddress)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when email is not valid: %s', (email) => {
    expect(() => UserEmail.fromString(email)).toThrow(UserDomainException.invalidUserEmail(email))
  })

  it('should store the correct value', () => {
    const validValue = UserEmailMother.valid().toString()
    const emailValueObject = UserEmail.fromString(validValue)

    expect(emailValueObject.value).toEqual(validValue)
  })
})
