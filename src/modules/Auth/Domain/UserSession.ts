import { UserSessionId } from '~/src/modules/Auth/Domain/ValueObject/UserSessionId'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserSessionHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionHash'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'

interface CreateUserSessionExtraParams {
  ipHash: UserSessionIpHash | null
  deviceCountry: string | null
  deviceCity: string | null
  deviceTimezone?: string | null
}

export type CreateUserSessionOptionalParams = Partial<CreateUserSessionExtraParams>

export class UserSession {
  public readonly id: UserSessionId
  public readonly userId: UserId
  public tokenHash: UserSessionHash
  public expiresAt: Date
  public revokedAt: Date | null
  public ipHash: UserSessionIpHash | null
  public userAgent: UserAgent
  public deviceCountry: string | null
  public deviceCity: string | null
  public deviceTimezone: string | null

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
    deviceCountry: string | null,
    deviceCity: string | null,
    deviceTimezone: string | null,
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
    this.deviceCountry = deviceCountry
    this.deviceCity = deviceCity
    this.deviceTimezone = deviceTimezone
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
    optionalParameters: CreateUserSessionOptionalParams,
  ): UserSession {
    return new UserSession(
      id,
      userId,
      tokenHash,
      expiresAt,
      null,
      optionalParameters?.ipHash ?? null,
      userAgent,
      optionalParameters?.deviceCountry ?? null,
      optionalParameters?.deviceCity ?? null,
      optionalParameters?.deviceTimezone ?? null,
      now,
      now,
    )
  }
}
