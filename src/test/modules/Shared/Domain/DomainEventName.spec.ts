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
    it('successfulLogin factory should return the correct domain event name', () => {
      const domainEventNameValueObject = DomainEventName.successfulLogin()

      expect(domainEventNameValueObject.value).toBe(ValidDomainEventNames.SUCCESSFUL_LOGIN)
    })

    it('successfulSignup factory should return the correct domain event name', () => {
      const domainEventNameValueObject = DomainEventName.successfulSignup()

      expect(domainEventNameValueObject.value).toBe(ValidDomainEventNames.SUCCESSFUL_SIGNUP)
    })

    it('successfulResetPassword factory should return the correct domain event name', () => {
      const domainEventNameValueObject = DomainEventName.successfulResetPassword()

      expect(domainEventNameValueObject.value).toBe(ValidDomainEventNames.SUCCESSFUL_RESET_PASSWORD)
    })

    it('failedLoginAttempt factory should return the correct domain event name', () => {
      const domainEventNameValueObject = DomainEventName.failedLoginAttempt()

      expect(domainEventNameValueObject.value).toBe(ValidDomainEventNames.FAILED_LOGIN_ATTEMPT)
    })

    it('emailVerificationRequest factory should return the correct domain event name', () => {
      const domainEventNameValueObject = DomainEventName.emailVerificationRequest()

      expect(domainEventNameValueObject.value).toBe(ValidDomainEventNames.EMAIL_VERIFICATION_REQUEST)
    })

    it('closedSession factory should return the correct domain event name', () => {
      const domainEventNameValueObject = DomainEventName.closedSession()

      expect(domainEventNameValueObject.value).toBe(ValidDomainEventNames.CLOSED_SESSION)
    })
  })
})
