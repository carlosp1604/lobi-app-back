import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { mock, mockReset } from 'jest-mock-extended'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserIpHashMother } from '~/src/test/mothers/Domain/Shared/UserIpHashMother'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'

describe('AuthDomainEventFactory', () => {
  const eventId = IdentifierMother.valid()
  const baseUserAgent = UserAgentMother.valid()
  const baseLocation = DeviceLocationMother.valid()
  const baseIpHash = UserIpHashMother.valid()

  const now = new Date('2026-02-19T16:18:00.000Z')

  const mockedIdGenerator = mock<IdGeneratorServiceInterface>()

  beforeEach(() => {
    mockReset(mockedIdGenerator)
    mockedIdGenerator.generateId.mockReturnValue(eventId.value)
  })

  const buildFactory = () => {
    return new AuthDomainEventFactory(mockedIdGenerator)
  }

  const checkIdGeneratorCall = () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockedIdGenerator.generateId).toHaveBeenCalledTimes(1)
  }

  const checkBaseEventStructure = (
    event: DomainEvent,
    expectedName: DomainEventName,
    expectedAggregateType: DomainEventAggregateType,
    expectedAggregateId: Identifier,
  ) => {
    expect(event.id.equals(eventId)).toBe(true)
    expect(event.name.equals(expectedName)).toBe(true)
    expect(event.aggregateType.equals(expectedAggregateType)).toBe(true)
    expect(event.aggregateId.equals(expectedAggregateId)).toBe(true)
    expect(event.occurredAt).toEqual(now)
  }

  describe('createPasswordResetEvent', () => {
    const userId = IdentifierMother.valid()
    const email = EmailAddressMother.valid()

    it('should create a valid DomainEvent for password reset', () => {
      const factory = buildFactory()

      const event = factory.createPasswordResetEvent(userId, email, baseLocation, baseUserAgent, baseIpHash.value, now)

      checkIdGeneratorCall()
      checkBaseEventStructure(event, DomainEventName.successfulResetPassword(), DomainEventAggregateType.user(), userId)

      expect(event.payload).toEqual({
        userId: userId.value,
        email: email.value,
        deviceLocation: {
          city: baseLocation.city,
          countryCode: baseLocation.countryCode,
        },
      })

      expect(event.metadata).toEqual({
        ipHash: baseIpHash.value,
        ua: baseUserAgent.value,
      })
    })

    it('should handle null location and ipHash correctly', () => {
      const factory = buildFactory()

      const event = factory.createPasswordResetEvent(userId, email, null, baseUserAgent, null, now)

      checkIdGeneratorCall()
      checkBaseEventStructure(event, DomainEventName.successfulResetPassword(), DomainEventAggregateType.user(), userId)

      expect(event.payload).toEqual({
        userId: userId.value,
        email: email.value,
        deviceLocation: null,
      })

      expect(event.metadata).toEqual({
        ipHash: null,
        ua: baseUserAgent.value,
      })
    })
  })

  describe('createSuccessfulLoginEvent', () => {
    const userId = IdentifierMother.valid()
    let userSessionBuilder: UserSessionTestBuilder

    beforeEach(() => {
      userSessionBuilder = new UserSessionTestBuilder()
        .withId(IdentifierMother.valid())
        .withUserId(userId)
        .withDeviceLocation(baseLocation)
        .withIpHash(baseIpHash)
        .withUserAgent(baseUserAgent)
    })

    it('should create a valid DomainEvent from a UserSession', () => {
      const isNewDevice = true
      const session = userSessionBuilder.build()

      const factory = buildFactory()
      const event = factory.createSuccessfulLoginEvent(session, isNewDevice, now)

      checkIdGeneratorCall()
      checkBaseEventStructure(event, DomainEventName.successfulLogin(), DomainEventAggregateType.user(), userId)

      expect(event.payload).toEqual({
        userId: userId.value,
        sessionId: session.id.value,
        isNewDevice: isNewDevice,
        deviceLocation: {
          city: baseLocation.city,
          countryCode: baseLocation.countryCode,
        },
      })

      expect(event.metadata).toEqual({
        ipHash: baseIpHash.value,
        ua: baseUserAgent.value,
      })
    })

    it('should handle null location and ipHash in session correctly', () => {
      const isNewDevice = false
      const sessionWithNullishIpHashAndLocation = userSessionBuilder.withIpHash(null).withDeviceLocation(null).build()

      const factory = buildFactory()
      const event = factory.createSuccessfulLoginEvent(sessionWithNullishIpHashAndLocation, isNewDevice, now)

      checkIdGeneratorCall()
      checkBaseEventStructure(event, DomainEventName.successfulLogin(), DomainEventAggregateType.user(), userId)

      expect(event.payload).toEqual({
        userId: userId.value,
        sessionId: sessionWithNullishIpHashAndLocation.id.value,
        isNewDevice: isNewDevice,
        deviceLocation: null,
      })

      expect(event.metadata).toEqual({
        ipHash: null,
        ua: baseUserAgent.value,
      })
    })
  })

  describe('createFailedAttemptEvent', () => {
    const userId = IdentifierMother.valid()

    it('should create a valid DomainEvent for a failed login attempt', () => {
      const factory = buildFactory()

      const event = factory.createFailedAttemptEvent(userId, baseLocation, baseUserAgent, baseIpHash.value, now)

      checkIdGeneratorCall()
      checkBaseEventStructure(event, DomainEventName.failedLoginAttempt(), DomainEventAggregateType.user(), userId)

      expect(event.payload).toEqual({
        userId: userId.value,
        deviceLocation: {
          city: baseLocation.city,
          countryCode: baseLocation.countryCode,
        },
      })

      expect(event.metadata).toEqual({
        ipHash: baseIpHash.value,
        ua: baseUserAgent.value,
      })
    })

    it('should handle null location and ipHash correctly', () => {
      const factory = buildFactory()

      const event = factory.createFailedAttemptEvent(userId, null, baseUserAgent, null, now)

      checkIdGeneratorCall()
      checkBaseEventStructure(event, DomainEventName.failedLoginAttempt(), DomainEventAggregateType.user(), userId)

      expect(event.payload).toEqual({
        userId: userId.value,
        deviceLocation: null,
      })

      expect(event.metadata).toEqual({
        ipHash: null,
        ua: baseUserAgent.value,
      })
    })
  })

  describe('createSuccessfulSignupEvent', () => {
    const userId = IdentifierMother.valid()
    const email = EmailAddressMother.valid()

    it('should create a valid DomainEvent for a successful signup', () => {
      const factory = buildFactory()

      const event = factory.createSuccessfulSignupEvent(userId, email, baseLocation, baseUserAgent, baseIpHash.value, now)

      checkIdGeneratorCall()
      checkBaseEventStructure(event, DomainEventName.successfulSignup(), DomainEventAggregateType.user(), userId)

      expect(event.payload).toEqual({
        userId: userId.value,
        deviceLocation: {
          city: baseLocation.city,
          countryCode: baseLocation.countryCode,
        },
        email: email.value,
      })

      expect(event.metadata).toEqual({
        ipHash: baseIpHash.value,
        ua: baseUserAgent.value,
      })
    })

    it('should handle null location and ipHash correctly', () => {
      const factory = buildFactory()

      const event = factory.createSuccessfulSignupEvent(userId, email, null, baseUserAgent, null, now)

      checkIdGeneratorCall()
      checkBaseEventStructure(event, DomainEventName.successfulSignup(), DomainEventAggregateType.user(), userId)

      expect(event.payload).toEqual({
        userId: userId.value,
        deviceLocation: null,
        email: email.value,
      })

      expect(event.metadata).toEqual({
        ipHash: null,
        ua: baseUserAgent.value,
      })
    })
  })

  describe('createEmailVerificationRequestEvent', () => {
    const verificationToken = new VerificationTokenTestBuilder().build()
    const resendCode = true
    const language = 'es'

    it('should create a valid DomainEvent for an email verification request', () => {
      const factory = buildFactory()

      const event = factory.createEmailVerificationRequestEvent(
        verificationToken,
        resendCode,
        language,
        baseLocation,
        baseUserAgent,
        baseIpHash.value,
        now,
      )

      checkIdGeneratorCall()
      checkBaseEventStructure(
        event,
        DomainEventName.emailVerificationRequest(),
        DomainEventAggregateType.verificationToken(),
        verificationToken.id,
      )

      expect(event.payload).toEqual({
        email: verificationToken.email.value,
        purpose: verificationToken.purpose.value,
        resendCode,
        lang: language,
        deviceLocation: {
          city: baseLocation.city,
          countryCode: baseLocation.countryCode,
        },
      })

      expect(event.metadata).toEqual({
        ipHash: baseIpHash.value,
        ua: baseUserAgent.value,
      })
    })

    it('should handle null location and ipHash correctly', () => {
      const factory = buildFactory()

      const event = factory.createEmailVerificationRequestEvent(verificationToken, resendCode, language, null, baseUserAgent, null, now)

      checkIdGeneratorCall()
      checkBaseEventStructure(
        event,
        DomainEventName.emailVerificationRequest(),
        DomainEventAggregateType.verificationToken(),
        verificationToken.id,
      )

      expect(event.payload).toEqual({
        email: verificationToken.email.value,
        purpose: verificationToken.purpose.value,
        resendCode,
        lang: language,
        deviceLocation: null,
      })

      expect(event.metadata).toEqual({
        ipHash: null,
        ua: baseUserAgent.value,
      })
    })
  })

  describe('createClosedSessionEvent', () => {
    const targetUserId = IdentifierMother.valid()
    const targetSessionId = IdentifierMother.valid()
    const actorSessionId = IdentifierMother.valid()

    it('should create a valid DomainEvent for a closed session', () => {
      const factory = buildFactory()

      const targetSession = new UserSessionTestBuilder()
        .withId(targetSessionId)
        .withUserId(targetUserId)
        .withDeviceLocation(baseLocation)
        .build()

      const actorLocation = DeviceLocationMother.valid()

      const event = factory.createClosedSessionEvent(targetSession, actorSessionId, actorLocation, baseUserAgent, baseIpHash.value, now)

      checkIdGeneratorCall()
      checkBaseEventStructure(event, DomainEventName.closedSession(), DomainEventAggregateType.userSession(), targetSession.id)

      expect(event.payload).toEqual({
        userId: targetSession.userId.value,
        targetSessionId: targetSession.id.value,
        targetDeviceLocation: {
          city: baseLocation.city,
          countryCode: baseLocation.countryCode,
        },
        actorDeviceLocation: {
          city: actorLocation.city,
          countryCode: actorLocation.countryCode,
        },
        actorUserAgent: baseUserAgent.value,
      })

      expect(event.metadata).toEqual({
        ipHash: baseIpHash.value,
        ua: baseUserAgent.value,
        actorSessionId: actorSessionId.value,
      })
    })

    it('should handle null locations and ipHash correctly for both target and actor', () => {
      const factory = buildFactory()

      const targetSession = new UserSessionTestBuilder()
        .withId(targetSessionId)
        .withUserId(targetUserId)
        .withDeviceLocation(null)
        .build()

      const event = factory.createClosedSessionEvent(targetSession, actorSessionId, null, baseUserAgent, null, now)

      checkIdGeneratorCall()
      checkBaseEventStructure(event, DomainEventName.closedSession(), DomainEventAggregateType.userSession(), targetSession.id)

      expect(event.payload).toEqual({
        userId: targetSession.userId.value,
        targetSessionId: targetSession.id.value,
        targetDeviceLocation: null,
        actorDeviceLocation: null,
        actorUserAgent: baseUserAgent.value,
      })

      expect(event.metadata).toEqual({
        ipHash: null,
        ua: baseUserAgent.value,
        actorSessionId: actorSessionId.value,
      })
    })
  })
})
