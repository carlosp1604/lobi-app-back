import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { UserSessionTokenHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionTokenHash'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'

export class UserSession {
  public readonly id: Identifier
  public readonly userId: Identifier
  public tokenHash: UserSessionTokenHash
  public expiresAt: Date
  public revokedAt: Date | null
  public ipHash: UserSessionIpHash | null
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
    ipHash: UserSessionIpHash | null,
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
    ipHash: UserSessionIpHash | null,
    deviceLocation: DeviceLocation | null,
  ): UserSession {
    const expiresAt = new Date(now.getTime() + expiresTtlMs)

    return new UserSession(id, userId, tokenHash, expiresAt, null, ipHash, userAgent, deviceLocation, now, now)
  }

  public revoke(now: Date): void {
    if (this.revokedAt !== null) {
      throw UserSessionDomainException.sessionAlreadyRevoked(this.id.toString())
    }

    if (this.expiresAt.getTime() <= now.getTime()) {
      throw UserSessionDomainException.sessionAlreadyExpired(this.id.toString())
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
