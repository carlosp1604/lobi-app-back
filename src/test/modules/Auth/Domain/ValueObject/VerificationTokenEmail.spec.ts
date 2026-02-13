import fc from 'fast-check'
import { VerificationTokenEmail } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenEmail'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenEmailMother } from '~/src/test/mothers/VerificationTokenEmailMother'

describe('VerificationTokenEmail', () => {
  describe('fromString', () => {
    it('should not throw error when email is valid', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (validVerificationTokenEmail) => {
          expect(() => VerificationTokenEmail.fromString(validVerificationTokenEmail)).not.toThrow()
        }),
      )
    })

    it.each(VerificationTokenEmailMother.INVALID_FORMAT_CASES)('should throw error when email is not valid: %s', (invalidEmail) => {
      expect(() => VerificationTokenEmail.fromString(invalidEmail)).toThrow(
        VerificationTokenDomainException.invalidVerificationTokenEmail(invalidEmail),
      )
    })
  })

  describe('safeCreate', () => {
    it('should return success when email is valid', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (validVerificationTokenEmail) => {
          const result = VerificationTokenEmail.safeCreate(validVerificationTokenEmail)

          expect(result.success).toBe(true)
        }),
      )
    })

    it.each(VerificationTokenEmailMother.INVALID_FORMAT_CASES)('should return error when email is not valid: %s', (invalidEmail) => {
      const result = VerificationTokenEmail.safeCreate(invalidEmail)

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(VerificationTokenDomainException.invalidVerificationTokenEmail(invalidEmail))
    })
  })

  it('should store the correct value', () => {
    const validValue = VerificationTokenEmailMother.valid().toString()
    const emailValueObject = VerificationTokenEmail.fromString(validValue)

    expect(emailValueObject.value).toEqual(validValue)
  })
})
