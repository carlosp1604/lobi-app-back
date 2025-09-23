import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserSessionId } from '~/src/modules/Auth/Domain/ValueObject/UserSessionId'
import { UserSessionHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionHash'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'

export class UserSessionTestBuilder {
  private _id = UserSessionIdMother.valid()
  private _userId = UserIdMother.valid()
  private _tokenHash = UserSessionIpHashMother.valid()
  private _ipHash: UserSessionIpHash | null = null
  private _userAgent: UserAgent | null = null
  private _deviceCountry: string | null = null
  private _deviceCity: string | null = null
  private _deviceTimezone: string | null = null
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

  withUserAgent(userAgent: UserAgent | null) {
    this._userAgent = userAgent
    return this
  }

  withDeviceCountry(deviceCountry: string | null) {
    this._deviceCountry = deviceCountry
    return this
  }

  withDeviceCity(deviceCity: string | null) {
    this._deviceCity = deviceCity
    return this
  }

  withDeviceTimezone(deviceTimezone: string | null) {
    this._deviceTimezone = deviceTimezone
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
      this._deviceCountry,
      this._deviceCity,
      this._deviceTimezone,
      this._createdAt,
      this._updatedAt,
    )
  }
}
