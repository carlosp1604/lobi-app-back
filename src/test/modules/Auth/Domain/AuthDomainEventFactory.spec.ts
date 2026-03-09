import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { mock, mockReset } from 'jest-mock-extended'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'

describe('AuthDomainEventFactory', () => {
  const validEventId = IdentifierMother.valid()
  const validUserId = IdentifierMother.valid()
  const validEmail = EmailAddressMother.valid()
  const validUserAgent = UserAgentMother.valid()
  const validIpHash = UserSessionIpHashMother.valid()
  const now = new Date('2026-02-19T16:18:00.000Z')

  const mockedIdGenerator = mock<IdGeneratorServiceInterface>()

  beforeEach(() => {
    mockReset(mockedIdGenerator)

    mockedIdGenerator.generateId.mockReturnValue(validEventId.value)
  })

  const buildFactory = () => {
    return new AuthDomainEventFactory(mockedIdGenerator)
  }

  const checkIdGeneratorCall = () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockedIdGenerator.generateId).toHaveBeenCalledTimes(1)
  }

  describe('createPasswordResetEvent', () => {
    it('should create a valid DomainEvent for password reset', () => {
      const location = DeviceLocationMother.valid()

      const factory = buildFactory()
      const event = factory.createPasswordResetEvent(validUserId, validEmail, location, validUserAgent, validIpHash.value, now)

      checkIdGeneratorCall()

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
        ipHash: validIpHash.value,
        ua: validUserAgent.value,
      })
    })

    it('should handle null location and ipHash correctly', () => {
      const factory = buildFactory()

      const event = factory.createPasswordResetEvent(validUserId, validEmail, null, validUserAgent, null, now)

      checkIdGeneratorCall()

      expect(event.payload.deviceLocation).toBeNull()
      expect(event.payload.userId).toBe(validUserId.value)
      expect(event.metadata.ipHash).toBeNull()
      expect(event.metadata.ua).toBe(validUserAgent.value)
    })
  })

  describe('createSuccessfulLoginEvent', () => {
    const expectedDeviceLocation = DeviceLocationMother.valid()
    let userSessionBuilder: UserSessionTestBuilder

    beforeEach(() => {
      userSessionBuilder = new UserSessionTestBuilder()
        .withId(IdentifierMother.valid())
        .withUserId(validUserId)
        .withDeviceLocation(expectedDeviceLocation)
        .withIpHash(validIpHash)
        .withUserAgent(validUserAgent)
    })

    it('should create a valid DomainEvent from a UserSession', () => {
      const isNewDevice = true
      const session = userSessionBuilder.build()

      const factory = buildFactory()
      const event = factory.createSuccessfulLoginEvent(session, isNewDevice, now)

      checkIdGeneratorCall()

      expect(event.id.equals(validEventId)).toBe(true)
      expect(event.name.equals(DomainEventName.successfulLogin())).toBe(true)
      expect(event.aggregateType.equals(DomainEventAggregateType.user())).toBe(true)
      expect(event.aggregateId.value).toBe(validUserId.value)

      expect(event.payload).toEqual({
        userId: validUserId.value,
        sessionId: session.id.value,
        isNewDevice: isNewDevice,
        deviceLocation: {
          city: expectedDeviceLocation.city,
          countryCode: expectedDeviceLocation.countryCode,
        },
      })

      expect(event.metadata).toEqual({
        ipHash: validIpHash.value,
        ua: validUserAgent.value,
      })
    })

    it('should handle null location and ipHash in session correctly', () => {
      const sessionWithNullishIpHashAndLocation = userSessionBuilder.withIpHash(null).withDeviceLocation(null).build()

      const factory = buildFactory()
      const event = factory.createSuccessfulLoginEvent(sessionWithNullishIpHashAndLocation, false, now)

      checkIdGeneratorCall()

      expect(event.payload.deviceLocation).toBeNull()
      expect(event.metadata.ipHash).toBeNull()
    })
  })

  describe('createFailedAttemptEvent', () => {
    it('should create a valid DomainEvent for a failed login attempt', () => {
      const location = DeviceLocationMother.valid()
      const factory = buildFactory()

      const event = factory.createFailedAttemptEvent(validUserId, location, validUserAgent, validIpHash.value, now)

      checkIdGeneratorCall()

      expect(event.id.equals(validEventId)).toBe(true)
      expect(event.name.equals(DomainEventName.failedLoginAttempt())).toBe(true)
      expect(event.aggregateType.equals(DomainEventAggregateType.user())).toBe(true)
      expect(event.aggregateId.value).toBe(validUserId.value)

      expect(event.payload).toEqual({
        userId: validUserId.value,
        deviceLocation: {
          city: location.city,
          countryCode: location.countryCode,
        },
      })

      expect(event.metadata).toEqual({
        ipHash: validIpHash.value,
        ua: validUserAgent.value,
      })
    })

    it('should handle null location and ipHash correctly', () => {
      const factory = buildFactory()

      const event = factory.createFailedAttemptEvent(validUserId, null, validUserAgent, null, now)

      expect(event.payload.deviceLocation).toBeNull()
      expect(event.metadata.ipHash).toBeNull()
      expect(event.metadata.ua).toBe(validUserAgent.value)
    })
  })

  describe('createSuccessfulSignupDomainEvent', () => {
    it('should create a valid DomainEvent for a successful signup', () => {
      const location = DeviceLocationMother.valid()
      const factory = buildFactory()

      const event = factory.createSuccessfulSignupDomainEvent(validUserId, validEmail, location, validUserAgent, validIpHash.value, now)

      checkIdGeneratorCall()

      expect(event.id.equals(validEventId)).toBe(true)
      expect(event.name.equals(DomainEventName.successfulSignup())).toBe(true)
      expect(event.aggregateType.equals(DomainEventAggregateType.user())).toBe(true)
      expect(event.aggregateId.value).toBe(validUserId.value)

      expect(event.payload).toEqual({
        userId: validUserId.value,
        deviceLocation: {
          city: location.city,
          countryCode: location.countryCode,
        },
        email: validEmail.value,
      })

      expect(event.metadata).toEqual({
        ipHash: validIpHash.value,
        ua: validUserAgent.value,
      })
    })

    it('should handle null location and ipHash correctly', () => {
      const factory = buildFactory()

      const event = factory.createSuccessfulSignupDomainEvent(validUserId, validEmail, null, validUserAgent, null, now)

      expect(event.payload.deviceLocation).toBeNull()
      expect(event.metadata.ipHash).toBeNull()
      expect(event.metadata.ua).toBe(validUserAgent.value)
    })
  })

  describe('createEmailVerificationRequestEvent', () => {
    const verificationToken = new VerificationTokenTestBuilder().build()
    const resendCode = true
    const language = 'es'

    it('should create a valid DomainEvent for an email verification request', () => {
      const location = DeviceLocationMother.valid()
      const factory = buildFactory()

      const event = factory.createEmailVerificationRequestEvent(
        verificationToken,
        resendCode,
        language,
        location,
        validUserAgent,
        validIpHash.value,
        now,
      )

      checkIdGeneratorCall()

      expect(event.id.equals(validEventId)).toBe(true)
      expect(event.name.equals(DomainEventName.emailVerificationRequest())).toBe(true)
      expect(event.aggregateType.equals(DomainEventAggregateType.verificationToken())).toBe(true)
      expect(event.aggregateId.value).toBe(verificationToken.id.value)

      expect(event.payload).toEqual({
        email: verificationToken.email.value,
        purpose: verificationToken.purpose.value,
        resendCode,
        lang: language,
        deviceLocation: {
          city: location.city,
          countryCode: location.countryCode,
        },
      })

      expect(event.metadata).toEqual({
        ipHash: validIpHash.value,
        ua: validUserAgent.value,
      })
    })

    it('should handle null location and ipHash correctly', () => {
      const factory = buildFactory()

      const event = factory.createEmailVerificationRequestEvent(
        verificationToken,
        resendCode,
        language,
        null,
        validUserAgent,
        null,
        now,
      )

      expect(event.payload.deviceLocation).toBeNull()
      expect(event.metadata.ipHash).toBeNull()
      expect(event.metadata.ua).toBe(validUserAgent.value)
    })
  })
})
