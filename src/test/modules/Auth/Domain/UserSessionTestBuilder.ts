import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserSessionId } from '~/src/modules/Auth/Domain/ValueObject/UserSessionId'
import { UserSessionHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionHash'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'

export class UserSessionTestBuilder {
  private _id = UserSessionIdMother.valid()
  private _userId = UserIdMother.valid()
  private _tokenHash = UserSessionIpHashMother.random()
  private _ipHash: UserSessionIpHash | null = null
  private _userAgent: UserAgent = UserAgentMother.valid()
  private _deviceLocation: DeviceLocation | null = null
  private _revokedAt: Date | null = null
  private _expiresAt = new Date()
  private _createdAt = new Date()
  private _updatedAt = new Date()

  withId(id: UserSessionId) {
    this._id = id
    return this
  }

  withUserId(userId: UserId) {
    this._userId = userId
    return this
  }

  withTokenHash(hash: UserSessionHash) {
    this._tokenHash = hash
    return this
  }

  withIpHash(ipHash: UserSessionIpHash | null) {
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
