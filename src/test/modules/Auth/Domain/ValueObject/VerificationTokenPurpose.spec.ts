import {
  ValidVerificationTokenPurposes,
  VerificationTokenPurpose,
} from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenPurposeMother } from '~/src/test/mothers/VerificationTokenPurposeMother'

describe('VerificationTokenPurpose', () => {
  describe('fromString', () => {
    it.each(VerificationTokenPurposeMother.VALID_PURPOSES)(
      'should not throw error when VerificationToken purpose is valid: %s',
      (purpose) => {
        expect(() => VerificationTokenPurpose.fromString(purpose)).not.toThrow()
      },
    )

    it.each(VerificationTokenPurposeMother.INVALID_PURPOSES)(
      'should throw error when VerificationToken purpose is not valid: %s',
      (purpose) => {
        expect(() => VerificationTokenPurpose.fromString(purpose)).toThrow(
          VerificationTokenDomainException.invalidVerificationTokenPurpose(purpose),
        )
      },
    )
  })

  describe('safeCreate', () => {
    it.each(VerificationTokenPurposeMother.VALID_PURPOSES)(
      'should not throw error when VerificationToken purpose is valid: %s',
      (purpose) => {
        const result = VerificationTokenPurpose.safeCreate(purpose)

        expect(result.success).toBe(true)
      },
    )

    it.each(VerificationTokenPurposeMother.INVALID_PURPOSES)(
      'should throw error when VerificationToken purpose is not valid: %s',
      (purpose) => {
        const result = VerificationTokenPurpose.safeCreate(purpose)

        expect(result.success).toBe(false)
        expect(result['error']).toEqual(VerificationTokenDomainException.invalidVerificationTokenPurpose(purpose))
      },
    )
  })

  describe('factories', () => {
    it('factory should return createAccount', () => {
      const verificationTokenPurposeValueObject = VerificationTokenPurpose.createAccount()

      expect(verificationTokenPurposeValueObject.value).toEqual(ValidVerificationTokenPurposes.CREATE_ACCOUNT)
    })

    it('factory should return resetPassword', () => {
      const verificationTokenPurposeValueObject = VerificationTokenPurpose.resetPassword()

      expect(verificationTokenPurposeValueObject.value).toEqual(ValidVerificationTokenPurposes.RESET_PASSWORD)
    })
  })

  it('should store the correct value', () => {
    const verificationTokenPurposeValueObject = VerificationTokenPurpose.fromString(ValidVerificationTokenPurposes.CREATE_ACCOUNT)

    expect(verificationTokenPurposeValueObject.value).toEqual(ValidVerificationTokenPurposes.CREATE_ACCOUNT)
  })
})
