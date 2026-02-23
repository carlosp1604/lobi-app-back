import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { mock, mockReset } from 'jest-mock-extended'

describe('AuthDomainEventFactory', () => {
  const validEventId = IdentifierMother.valid()
  const validUserId = IdentifierMother.valid()
  const validEmail = EmailAddressMother.valid()
  const validUserAgent = UserAgentMother.valid()
  const validIpHash = 'some-ip-hash'
  const now = new Date('2026-02-19T16:18:00.000Z')

  const mockedIdGenerator = mock<IdGeneratorServiceInterface>()

  beforeEach(() => {
    mockReset(mockedIdGenerator)

    mockedIdGenerator.generateId.mockReturnValue(validEventId.value)
  })

  const buildFactory = () => {
    return new AuthDomainEventFactory(mockedIdGenerator)
  }

  describe('createPasswordResetEvent', () => {
    it('should create a valid DomainEvent with all data including device location', () => {
      const location = DeviceLocationMother.valid()

      const factory = buildFactory()
      const event = factory.createPasswordResetEvent(validUserId, validEmail, location, validUserAgent, validIpHash, now)

      expect(event.id.equals(validEventId)).toBe(true)
      expect(event.name.equals(DomainEventName.successfulResetPassword())).toBe(true)
      expect(event.aggregateType.equals(DomainEventAggregateType.user())).toBe(true)
      expect(event.aggregateId.value).toBe(validUserId.value)
      expect(event.occurredAt).toBe(now)

      expect(event.payload).toEqual({
        userId: validUserId.value,
        email: validEmail.value,
        deviceLocation: {
          city: location.city,
          countryCode: location.countryCode,
        },
      })

      expect(event.metadata).toEqual({
        ipHash: validIpHash,
        ua: validUserAgent.value,
      })
    })

    it('should create a valid DomainEvent when device location is null', () => {
      const factory = buildFactory()

      const event = factory.createPasswordResetEvent(validUserId, validEmail, null, validUserAgent, validIpHash, now)

      expect(event.payload.deviceLocation).toBeNull()
      expect(event.payload.userId).toBe(validUserId.value)
      expect(event.metadata.ua).toBe(validUserAgent.value)
    })

    it('should create a valid DomainEvent when ipHash is null', () => {
      const factory = buildFactory()

      const event = factory.createPasswordResetEvent(validUserId, validEmail, null, validUserAgent, null, now)

      expect(event.metadata.ipHash).toBeNull()
    })
  })
})
