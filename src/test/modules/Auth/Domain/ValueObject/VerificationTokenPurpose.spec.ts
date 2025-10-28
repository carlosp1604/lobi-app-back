import {
  ValidVerificationTokenPurposes,
  VerificationTokenPurpose,
} from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'

const validVerificationTokenPurposes: Array<ValidVerificationTokenPurposes> = Object.values(ValidVerificationTokenPurposes)

const invalidCases = ['', 'random-purpose', '2222', 'remove-account', 'create-account', 'change-password']

describe('VerificationTokenPurpose', () => {
  describe('constructor', () => {
    it.each(validVerificationTokenPurposes)('should not throw error when VerificationToken purpose is valid: %s', (purpose) => {
      expect(() => VerificationTokenPurpose.fromString(purpose)).not.toThrow()
    })

    it.each(invalidCases)('should throw error when VerificationToken purpose is not valid: %s', (purpose) => {
      expect(() => VerificationTokenPurpose.fromString(purpose)).toThrow(
        VerificationTokenDomainException.invalidVerificationTokenPurpose(purpose),
      )
    })
  })

  describe('get value', () => {
    it('should store the correct value', () => {
      const verificationTokenPurposeValueObject = VerificationTokenPurpose.fromString(ValidVerificationTokenPurposes.CREATE_ACCOUNT)

      expect(verificationTokenPurposeValueObject.value).toEqual(ValidVerificationTokenPurposes.CREATE_ACCOUNT)
    })
  })

  describe('createAccount', () => {
    it('factory should return createAccount', () => {
      const verificationTokenPurposeValueObject = VerificationTokenPurpose.createAccount()

      expect(verificationTokenPurposeValueObject.value).toEqual(ValidVerificationTokenPurposes.CREATE_ACCOUNT)
    })
  })

  describe('resetPassword', () => {
    it('factory should return resetPassword', () => {
      const verificationTokenPurposeValueObject = VerificationTokenPurpose.resetPassword()

      expect(verificationTokenPurposeValueObject.value).toEqual(ValidVerificationTokenPurposes.RESET_PASSWORD)
    })
  })
})
