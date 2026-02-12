import { DomainEventName, ValidDomainEventNames } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventDomainException } from '~/src/modules/Shared/Domain/DomainEventDomainException'

const validDomainEventNames: Array<ValidDomainEventNames> = Object.values(ValidDomainEventNames)

const invalidCases = ['', 'random-event-name', '1111', 'REMOVE_LOGIN', 'LOGIN', 'successFulLogin ', 'successFulLogOUT']

describe('DomainEventName', () => {
  describe('constructor', () => {
    it.each(validDomainEventNames)('should not throw error when domain event name is valid: %s', (domainEventName) => {
      expect(() => DomainEventName.fromString(String(domainEventName))).not.toThrow()
    })

    it.each(invalidCases)('should throw error when domain event name is not valid: %s', (domainEventName) => {
      expect(() => DomainEventName.fromString(domainEventName)).toThrow(
        DomainEventDomainException.invalidDomainEventName(domainEventName),
      )
    })
  })

  describe('get value', () => {
    it('should store the correct value', () => {
      const domainEventNameValueObject = DomainEventName.fromString(ValidDomainEventNames.SUCCESSFUL_LOGIN)

      expect(domainEventNameValueObject.value).toEqual(ValidDomainEventNames.SUCCESSFUL_LOGIN)
    })
  })

  describe('successfulLogin', () => {
    it('factory should return successfulLogin', () => {
      const domainEventNameValueObject = DomainEventName.successfulLogin()

      expect(domainEventNameValueObject.value).toEqual(ValidDomainEventNames.SUCCESSFUL_LOGIN)
    })
  })

  describe('failedLoginAttempt', () => {
    it('factory should return failedLoginAttempt', () => {
      const domainEventNameValueObject = DomainEventName.failedLoginAttempt()

      expect(domainEventNameValueObject.value).toEqual(ValidDomainEventNames.FAILED_LOGIN_ATTEMPT)
    })
  })

  describe('emailVerificationRequest', () => {
    it('factory should return emailVerificationRequest', () => {
      const domainEventNameValueObject = DomainEventName.emailVerificationRequest()

      expect(domainEventNameValueObject.value).toEqual(ValidDomainEventNames.EMAIL_VERIFICATION_REQUEST)
    })
  })
})
