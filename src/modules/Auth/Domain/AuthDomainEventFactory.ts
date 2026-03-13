import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'

export class AuthDomainEventFactory {
  constructor(private readonly idGeneratorService: IdGeneratorServiceInterface) {}

  public createPasswordResetEvent(
    userId: Identifier,
    userEmail: EmailAddress,
    deviceLocation: DeviceLocation | null,
    userAgent: UserAgent,
    ipHash: string | null,
    occurredAt: Date,
  ): DomainEvent {
    return DomainEvent.create(
      Identifier.fromString(this.idGeneratorService.generateId()),
      DomainEventName.successfulResetPassword(),
      DomainEventAggregateType.user(),
      userId,
      {
        userId: userId.value,
        email: userEmail.value,
        deviceLocation: this.mapLocation(deviceLocation),
      },
      this.mapMetadata(ipHash, userAgent),

      occurredAt,
    )
  }

  public createSuccessfulLoginEvent(session: UserSession, isNewDevice: boolean, now: Date): DomainEvent {
    return DomainEvent.create(
      Identifier.fromString(this.idGeneratorService.generateId()),
      DomainEventName.successfulLogin(),
      DomainEventAggregateType.user(),
      session.userId,
      {
        userId: session.userId.value,
        deviceLocation: this.mapLocation(session.deviceLocation),
        sessionId: session.id.value,
        isNewDevice,
      },
      this.mapMetadata(session.ipHash ? session.ipHash.value : null, session.userAgent),
      now,
    )
  }

  public createFailedAttemptEvent(
    userId: Identifier,
    deviceLocation: DeviceLocation | null,
    userAgent: UserAgent,
    ipHash: string | null,
    now: Date,
  ): DomainEvent {
    return DomainEvent.create(
      Identifier.fromString(this.idGeneratorService.generateId()),
      DomainEventName.failedLoginAttempt(),
      DomainEventAggregateType.user(),
      userId,
      {
        userId: userId.value,
        deviceLocation: this.mapLocation(deviceLocation),
      },
      this.mapMetadata(ipHash, userAgent),
      now,
    )
  }

  public createSuccessfulSignupEvent(
    userId: Identifier,
    userEmail: EmailAddress,
    deviceLocation: DeviceLocation | null,
    userAgent: UserAgent,
    ipHash: string | null,
    now: Date,
  ): DomainEvent {
    return DomainEvent.create(
      Identifier.fromString(this.idGeneratorService.generateId()),
      DomainEventName.successfulSignup(),
      DomainEventAggregateType.user(),
      userId,
      {
        userId: userId.value,
        deviceLocation: this.mapLocation(deviceLocation),
        email: userEmail.value,
      },
      this.mapMetadata(ipHash, userAgent),
      now,
    )
  }

  public createEmailVerificationRequestEvent(
    verificationToken: VerificationToken,
    resendCode: boolean,
    language: string,
    deviceLocation: DeviceLocation | null,
    userAgent: UserAgent,
    ipHash: string | null,
    now: Date,
  ): DomainEvent {
    return DomainEvent.create(
      Identifier.fromString(this.idGeneratorService.generateId()),
      DomainEventName.emailVerificationRequest(),
      DomainEventAggregateType.verificationToken(),
      verificationToken.id,
      {
        email: verificationToken.email.value,
        purpose: verificationToken.purpose.value,
        resendCode,
        lang: language,
        deviceLocation: this.mapLocation(deviceLocation),
      },
      this.mapMetadata(ipHash, userAgent),
      now,
    )
  }

  public createClosedSessionEvent(
    targetSession: UserSession,
    actorSessionId: Identifier,
    actorDeviceLocation: DeviceLocation | null,
    actorUserAgent: UserAgent,
    actorIpHash: string | null,
    now: Date,
  ): DomainEvent {
    return DomainEvent.create(
      Identifier.fromString(this.idGeneratorService.generateId()),
      DomainEventName.closedSession(),
      DomainEventAggregateType.userSession(),
      targetSession.id,
      {
        userId: targetSession.userId.value,
        targetSessionId: targetSession.id.value,
        targetDeviceLocation: this.mapLocation(targetSession.deviceLocation),
        actorDeviceLocation: this.mapLocation(actorDeviceLocation),
        actorUserAgent: actorUserAgent.raw,
      },
      {
        ...this.mapMetadata(actorIpHash, actorUserAgent),
        actorSessionId: actorSessionId.value,
      },
      now,
    )
  }

  private mapLocation(location: DeviceLocation | null) {
    if (!location) {
      return null
    }

    return {
      city: location.city,
      countryCode: location.countryCode,
    }
  }

  private mapMetadata(ipHash: string | null, userAgent: UserAgent) {
    return {
      ipHash: ipHash,
      ua: userAgent.raw,
    }
  }
}
