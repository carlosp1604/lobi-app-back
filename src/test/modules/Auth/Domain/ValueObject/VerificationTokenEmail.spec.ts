import fc from 'fast-check'
import { VerificationTokenEmail } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenEmail'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenEmailMother } from '~/src/test/mothers/VerificationTokenEmailMother'

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

describe('VerificationTokenEmail', () => {
  it('should not throw error when email is valid', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (validVerificationTokenEmail) => {
        expect(() => VerificationTokenEmail.fromString(validVerificationTokenEmail)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when email is not valid: %s', (invalidEmail) => {
    expect(() => VerificationTokenEmail.fromString(invalidEmail)).toThrow(
      VerificationTokenDomainException.invalidVerificationTokenEmail(invalidEmail),
    )
  })

  it('should store the correct value', () => {
    const validValue = VerificationTokenEmailMother.valid().toString()
    const emailValueObject = VerificationTokenEmail.fromString(validValue)

    expect(emailValueObject.value).toEqual(validValue)
  })
})
