import { DomainEventDomainException } from '~/src/modules/Shared/Domain/DomainEventDomainException'
import {
  DomainEventAggregateType,
  ValidDomainEventAggregateTypes,
} from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'

const validDomainEventAggregateTypes: Array<ValidDomainEventAggregateTypes> = Object.values(ValidDomainEventAggregateTypes)

const invalidCases = ['', 'random-event-aggregate-type', '1111', 'USER1', 'NOT-VALID', 'user ', 'users']

describe('DomainEventAggregateType', () => {
  describe('constructor', () => {
    it.each(validDomainEventAggregateTypes)(
      'should not throw error when domain event aggregate type is valid: %s',
      (domainEventAggregateType) => {
        expect(() => DomainEventAggregateType.fromString(String(domainEventAggregateType))).not.toThrow()
      },
    )

    it.each(invalidCases)('should throw error when domain event aggregate type is not valid: %s', (domainEventAggregateType) => {
      expect(() => DomainEventAggregateType.fromString(domainEventAggregateType)).toThrow(
        DomainEventDomainException.invalidDomainEventAggregateType(domainEventAggregateType),
      )
    })
  })

  describe('get value', () => {
    it('should store the correct value', () => {
      const domainEventAggregateTypeValueObject = DomainEventAggregateType.fromString(ValidDomainEventAggregateTypes.USER)

      expect(domainEventAggregateTypeValueObject.value).toBe(ValidDomainEventAggregateTypes.USER)
    })
  })

  describe('factories', () => {
    it('user factory should return the correct domain event aggregate type', () => {
      const domainEventAggregateTypeValueObject = DomainEventAggregateType.user()

      expect(domainEventAggregateTypeValueObject.value).toBe(ValidDomainEventAggregateTypes.USER)
    })

    it('verificationToken factory should return the correct domain event aggregate type', () => {
      const domainEventAggregateTypeValueObject = DomainEventAggregateType.verificationToken()

      expect(domainEventAggregateTypeValueObject.value).toBe(ValidDomainEventAggregateTypes.VERIFICATION_TOKEN)
    })

    it('userSession factory should return the correct domain event aggregate type', () => {
      const domainEventAggregateTypeValueObject = DomainEventAggregateType.userSession()

      expect(domainEventAggregateTypeValueObject.value).toBe(ValidDomainEventAggregateTypes.USER_SESSION)
    })
  })
})
