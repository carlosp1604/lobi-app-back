import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { UserSessionTokenHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionTokenHash'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserSessionTokenHashMother } from '~/src/test/mothers/UserSessionTokenHashMother'

export class UserSessionTestBuilder {
  private _id = IdentifierMother.valid()
  private _userId = IdentifierMother.valid()
  private _tokenHash = UserSessionTokenHashMother.random()
  private _ipHash: UserIpHash | null = null
  private _userAgent: UserAgent = UserAgentMother.valid()
  private _deviceLocation: DeviceLocation | null = null
  private _revokedAt: Date | null = null
  private _expiresAt = new Date()
  private _createdAt = new Date()
  private _updatedAt = new Date()

  withId(id: Identifier) {
    this._id = id
    return this
  }

  withUserId(userId: Identifier) {
    this._userId = userId
    return this
  }

  withTokenHash(hash: UserSessionTokenHash) {
    this._tokenHash = hash
    return this
  }

  withIpHash(ipHash: UserIpHash | null) {
    this._ipHash = ipHash
    return this
  }

  withUserAgent(userAgent: UserAgent) {
    this._userAgent = userAgent
    return this
  }

  withDeviceLocation(deviceLocation: DeviceLocation | null) {
    this._deviceLocation = deviceLocation
    return this
  }

  withRevokedAt(date: Date | null) {
    this._revokedAt = date
    return this
  }

  withExpiresAt(date: Date) {
    this._expiresAt = date
    return this
  }

  withCreatedAt(date: Date) {
    this._createdAt = date
    return this
  }

  withUpdatedAt(date: Date) {
    this._updatedAt = date
    return this
  }

  build(): UserSession {
    return new UserSession(
      this._id,
      this._userId,
      this._tokenHash,
      this._expiresAt,
      this._revokedAt,
      this._ipHash,
      this._userAgent,
      this._deviceLocation,
      this._createdAt,
      this._updatedAt,
    )
  }
}
