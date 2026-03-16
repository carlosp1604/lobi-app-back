import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { UserSessionTokenHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionTokenHash'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'

export class UserSession {
  public readonly id: Identifier
  public readonly userId: Identifier
  public tokenHash: UserSessionTokenHash
  public expiresAt: Date
  public revokedAt: Date | null
  public ipHash: UserIpHash | null
  public userAgent: UserAgent
  public deviceLocation: DeviceLocation | null

  public readonly createdAt: Date
  public updatedAt: Date

  public constructor(
    id: Identifier,
    userId: Identifier,
    tokenHash: UserSessionTokenHash,
    expiresAt: Date,
    revokedAt: Date | null,
    ipHash: UserIpHash | null,
    userAgent: UserAgent,
    deviceLocation: DeviceLocation | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id
    this.userId = userId
    this.tokenHash = tokenHash
    this.expiresAt = expiresAt
    this.revokedAt = revokedAt
    this.ipHash = ipHash
    this.userAgent = userAgent
    this.deviceLocation = deviceLocation
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  static create(
    id: Identifier,
    userId: Identifier,
    tokenHash: UserSessionTokenHash,
    userAgent: UserAgent,
    expiresTtlMs: number,
    now: Date,
    ipHash: UserIpHash | null,
    deviceLocation: DeviceLocation | null,
  ): UserSession {
    const expiresAt = new Date(now.getTime() + expiresTtlMs)

    return new UserSession(id, userId, tokenHash, expiresAt, null, ipHash, userAgent, deviceLocation, now, now)
  }

  public canBeRevoked(now: Date): Result<void, UserSessionDomainException> {
    if (this.isRevoked()) {
      return fail(UserSessionDomainException.sessionAlreadyRevoked(this.id.value))
    }

    if (this.isExpired(now)) {
      return fail(UserSessionDomainException.sessionAlreadyExpired(this.id.value))
    }

    return success(undefined)
  }

  public revoke(now: Date): void {
    const canBeRevokedResult = this.canBeRevoked(now)

    if (!canBeRevokedResult.success) {
      throw canBeRevokedResult.error
    }

    this.revokedAt = now
    this.updatedAt = now
  }

  public isSameDeviceAs(session: UserSession): boolean {
    const sameUa = this.userAgent.equals(session.userAgent)

    if (!this.ipHash && !session.ipHash) {
      return sameUa
    }

    if (this.ipHash && session.ipHash && this.ipHash.equals(session.ipHash)) {
      return sameUa
    }

    return false
  }

  public isRevoked(): boolean {
    return this.revokedAt !== null
  }

  public isExpired(now: Date): boolean {
    return this.expiresAt.getTime() <= now.getTime()
  }
}
