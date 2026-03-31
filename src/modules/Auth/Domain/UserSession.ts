import { DeviceInfo } from '~/src/modules/Auth/Domain/ValueObject/DeviceInfo'
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
  public readonly expiresAt: Date
  private _revokedAt: Date | null
  public readonly ipHash: UserIpHash | null
  public readonly deviceInfo: DeviceInfo
  public readonly deviceLocation: DeviceLocation | null
  public readonly createdAt: Date
  private _updatedAt: Date

  public constructor(
    id: Identifier,
    userId: Identifier,
    tokenHash: UserSessionTokenHash,
    expiresAt: Date,
    revokedAt: Date | null,
    ipHash: UserIpHash | null,
    deviceInfo: DeviceInfo,
    deviceLocation: DeviceLocation | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id
    this.userId = userId
    this.tokenHash = tokenHash
    this.expiresAt = expiresAt
    this._revokedAt = revokedAt
    this.ipHash = ipHash
    this.deviceInfo = deviceInfo
    this.deviceLocation = deviceLocation
    this.createdAt = createdAt
    this._updatedAt = updatedAt
  }

  public get revokedAt(): Date | null {
    return this._revokedAt
  }

  public get updatedAt(): Date {
    return this._updatedAt
  }

  static create(
    id: Identifier,
    userId: Identifier,
    tokenHash: UserSessionTokenHash,
    deviceInfo: DeviceInfo,
    expiresTtlMs: number,
    now: Date,
    ipHash: UserIpHash | null,
    deviceLocation: DeviceLocation | null,
  ): UserSession {
    const expiresAt = new Date(now.getTime() + expiresTtlMs)

    return new UserSession(id, userId, tokenHash, expiresAt, null, ipHash, deviceInfo, deviceLocation, now, now)
  }

  public canBeRevoked(now: Date): Result<void, UserSessionDomainException> {
    if (this.isRevoked()) {
      return fail(UserSessionDomainException.sessionAlreadyRevoked())
    }

    if (this.isExpired(now)) {
      return fail(UserSessionDomainException.sessionAlreadyExpired())
    }

    return success(undefined)
  }

  public revoke(now: Date): void {
    const canBeRevokedResult = this.canBeRevoked(now)

    if (!canBeRevokedResult.success) {
      throw canBeRevokedResult.error
    }

    this._revokedAt = now
    this._updatedAt = now
  }

  public isRevoked(): boolean {
    return this._revokedAt !== null
  }

  public isExpired(now: Date): boolean {
    return this.expiresAt.getTime() <= now.getTime()
  }
}
