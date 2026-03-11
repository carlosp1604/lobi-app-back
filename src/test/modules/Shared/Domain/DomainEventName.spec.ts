import { DomainEventName, ValidDomainEventNames } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventDomainException } from '~/src/modules/Shared/Domain/DomainEventDomainException'
import { DomainEventNameMother } from '~/src/test/mothers/DomainEventNameMother'

describe('DomainEventName', () => {
  describe('constructor', () => {
    it.each(DomainEventNameMother.VALID_VALUES)('should not throw error when domain event name is valid: %s', (domainEventName) => {
      expect(() => DomainEventName.fromString(String(domainEventName))).not.toThrow()
    })

    it.each(DomainEventNameMother.INVALID_VALUES)('should throw error when domain event name is not valid: %s', (domainEventName) => {
      expect(() => DomainEventName.fromString(domainEventName)).toThrow(
        DomainEventDomainException.invalidDomainEventName(domainEventName),
      )
    })
  })

  describe('get value', () => {
    it('should store the correct value', () => {
      const domainEventNameValueObject = DomainEventName.fromString(ValidDomainEventNames.SUCCESSFUL_LOGIN)

      expect(domainEventNameValueObject.value).toBe(ValidDomainEventNames.SUCCESSFUL_LOGIN)
    })
  })

  describe('factories', () => {
    it('factory should return successfulLogin', () => {
      const domainEventNameValueObject = DomainEventName.successfulLogin()

      expect(domainEventNameValueObject.value).toBe(ValidDomainEventNames.SUCCESSFUL_LOGIN)
    })

    it('factory should return successfulSignup', () => {
      const domainEventNameValueObject = DomainEventName.successfulSignup()

      expect(domainEventNameValueObject.value).toBe(ValidDomainEventNames.SUCCESSFUL_SIGNUP)
    })

    it('factory should return successfulResetPassword', () => {
      const domainEventNameValueObject = DomainEventName.successfulResetPassword()

      expect(domainEventNameValueObject.value).toBe(ValidDomainEventNames.SUCCESSFUL_RESET_PASSWORD)
    })

    it('factory should return failedLoginAttempt', () => {
      const domainEventNameValueObject = DomainEventName.failedLoginAttempt()

      expect(domainEventNameValueObject.value).toBe(ValidDomainEventNames.FAILED_LOGIN_ATTEMPT)
    })

    it('factory should return emailVerificationRequest', () => {
      const domainEventNameValueObject = DomainEventName.emailVerificationRequest()

      expect(domainEventNameValueObject.value).toBe(ValidDomainEventNames.EMAIL_VERIFICATION_REQUEST)
    })
  })
})
