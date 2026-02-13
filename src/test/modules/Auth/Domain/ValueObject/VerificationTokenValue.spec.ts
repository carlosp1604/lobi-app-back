import fc from 'fast-check'
import { VerificationTokenValue } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenValue'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenValueMother } from '~/src/test/mothers/VerificationTokenValueMother'

const validValues = fc.stringMatching(VerificationTokenValue.REGEX)

const invalidCases: string[] = ['', '1234567', '123456789', '123a5678', '123 5678', '--------', '        ']

describe('VerificationTokenValue', () => {
  it('should not throw error when token value is valid', () => {
    fc.assert(
      fc.property(validValues, (value) => {
        expect(() => VerificationTokenValue.fromString(value)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when token value is not valid: "%s"', (invalidCode) => {
    expect(() => VerificationTokenValue.fromString(invalidCode)).toThrow(
      VerificationTokenDomainException.invalidVerificationTokenValue(invalidCode),
    )
  })

  it('should store the correct value', () => {
    const validValue = VerificationTokenValueMother.valid().value
    const verificationTokenValueValueObject = VerificationTokenValue.fromString(validValue)

    expect(verificationTokenValueValueObject.value).toEqual(validValue)
  })
})
