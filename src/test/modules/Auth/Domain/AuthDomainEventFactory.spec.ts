import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventIdMother } from '~/src/test/mothers/DomainEventIdMother'

describe('AuthDomainEventFactory', () => {
  const validEventId = DomainEventIdMother.valid()
  const validUserId = UserIdMother.valid()
  const validEmail = UserEmailMother.valid()
  const validUserAgent = UserAgentMother.valid()
  const validIpHash = 'some-ip-hash'
  const now = new Date('2026-02-19T16:18:00.000Z')

  describe('createPasswordResetEvent', () => {
    it('should create a valid DomainEvent with all data including device location', () => {
      const location = DeviceLocationMother.valid()

      const event = AuthDomainEventFactory.createPasswordResetEvent(
        validEventId.value,
        validUserId,
        validEmail,
        location,
        validUserAgent,
        validIpHash,
        now,
      )

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
      const event = AuthDomainEventFactory.createPasswordResetEvent(
        validEventId.value,
        validUserId,
        validEmail,
        null,
        validUserAgent,
        validIpHash,
        now,
      )

      expect(event.payload.deviceLocation).toBeNull()
      expect(event.payload.userId).toBe(validUserId.value)
      expect(event.metadata.ua).toBe(validUserAgent.value)
    })

    it('should create a valid DomainEvent when ipHash is null', () => {
      const event = AuthDomainEventFactory.createPasswordResetEvent(
        validEventId.value,
        validUserId,
        validEmail,
        null,
        validUserAgent,
        null,
        now,
      )

      expect(event.metadata.ipHash).toBeNull()
    })
  })
})
