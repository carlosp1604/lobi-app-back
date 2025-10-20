import { UserSessionId } from '~/src/modules/Auth/Domain/ValueObject/UserSessionId'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserSessionHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionHash'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'

export class UserSession {
  public readonly id: UserSessionId
  public readonly userId: UserId
  public tokenHash: UserSessionHash
  public expiresAt: Date
  public revokedAt: Date | null
  public ipHash: UserSessionIpHash | null
  public userAgent: UserAgent
  public deviceLocation: DeviceLocation | null

  public readonly createdAt: Date
  public updatedAt: Date

  public constructor(
    id: UserSessionId,
    userId: UserId,
    tokenHash: UserSessionHash,
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
    id: UserSessionId,
    userId: UserId,
    tokenHash: UserSessionHash,
    userAgent: UserAgent,
    expiresAt: Date,
    now: Date,
    ipHash: UserSessionIpHash | null,
    deviceLocation: DeviceLocation | null,
  ): UserSession {
    return new UserSession(id, userId, tokenHash, expiresAt, null, ipHash, userAgent, deviceLocation, now, now)
  }

  public revoke(now: Date): void {
    if (this.revokedAt !== null) {
      throw UserSessionDomainException.sessionAlreadyRevoked(this.id.toString())
    }

    if (this.expiresAt.getTime() <= now.getTime()) {
      throw UserSessionDomainException.sessionNotActive(this.id.toString())
    }

    this.revokedAt = now
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
}
