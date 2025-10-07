import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { User } from '~/src/modules/User/Domain/User'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { LoginUserApplicationRequestDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationRequestDto'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { LoginUserApplicationResponseDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationResponseDto'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { PasswordHasherServiceInterface } from '~/src/modules/Auth/Domain/PasswordHasherServiceInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { DeviceLocationResolverServiceInterface } from '~/src/modules/Auth/Domain/DeviceLocationResolverServiceInterface'
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { UserSessionId } from '~/src/modules/Auth/Domain/ValueObject/UserSessionId'
import { UserSessionHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionHash'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { DomainEventId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventId'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { IpValidatorServiceInterface } from '~/src/modules/Auth/Domain/IpValidatorServiceInterface'
import { TokenGeneratorApplicationServiceInterface } from '~/src/modules/Auth/Application/TokenGenerator/TokenGeneratorApplicationServiceInterface'

interface NormalizedIpWithHash {
  normalizedIp: string
  hashedIp: UserSessionIpHash
}

interface ResolvedDeviceLocation {
  country: string | null
  city: string | null
  timezone: string | null
}

export class LoginUser {
  constructor(
    private readonly usersRepository: UserRepositoryInterface,
    private readonly credentialsRepository: UserCredentialRepositoryInterface,
    private readonly sessionsRepository: UserSessionRepositoryInterface,
    private readonly domainEventRepository: DomainEventRepositoryInterface,
    private readonly passwordHasher: PasswordHasherServiceInterface,
    private readonly tokenGenerator: TokenGeneratorApplicationServiceInterface,
    private readonly hasherService: HasherServiceInterface,
    private readonly deviceLocationResolver: DeviceLocationResolverServiceInterface,
    private readonly maxSessionsPolicy: MaxSessionsPolicy,
    private readonly clock: ClockServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly loggerService: LoggerServiceInterface,
    private readonly idGeneratorService: IdGeneratorServiceInterface,
    private readonly ipValidator: IpValidatorServiceInterface,
    private readonly accessTtlMilliseconds: number,
    private readonly refreshTtlMilliseconds: number,
  ) {}

  public async execute(
    request: LoginUserApplicationRequestDto,
  ): Promise<Result<LoginUserApplicationResponseDto, LoginUserApplicationError>> {
    const now = this.clock.now()

    const validateUserEmailResult = this.validateUserEmail(request.email)

    if (!validateUserEmailResult.success) {
      return validateUserEmailResult
    }

    const userEmail = validateUserEmailResult.value
    const userAgent = this.validateUserAgent(request.userAgent, userEmail)

    const getUserWithCredentialsResult = await this.getAndValidateUserWithCredentials(userEmail)

    if (!getUserWithCredentialsResult.success) {
      return getUserWithCredentialsResult
    }

    const user: User = getUserWithCredentialsResult.value
    const credentials: UserCredential = user.credential as UserCredential

    const validateAndHashIpResult = await this.validateAndHashIp(request.ip, userAgent, user)

    let sessionIpHash: UserSessionIpHash | null = null
    let normalizedIp: string | null = null

    if (validateAndHashIpResult) {
      sessionIpHash = validateAndHashIpResult.hashedIp
      normalizedIp = validateAndHashIpResult.normalizedIp
    }

    const deviceLocation = await this.resolveDeviceLocation(normalizedIp, userEmail, userAgent)

    const validatePasswordResult = await this.validateCredentials(
      credentials,
      request.password,
      user,
      sessionIpHash,
      userAgent,
      deviceLocation,
      now,
    )

    if (!validatePasswordResult.success) {
      return validatePasswordResult
    }

    credentials.resetAfterSuccessfulLogin(now)

    const sessionId = UserSessionId.fromString(this.idGeneratorService.generateId())
    const sessionExpiresAt = new Date(now.getTime() + this.refreshTtlMilliseconds)
    const clearSessionToken = await this.tokenGenerator.generateSessionToken()
    const hashedToken = await this.hasherService.hash(clearSessionToken)
    const sessionHash = UserSessionHash.fromString(hashedToken)

    const session = UserSession.create(sessionId, user.id, sessionHash, userAgent, sessionExpiresAt, now, {
      ipHash: sessionIpHash,
      deviceCountry: deviceLocation.country,
      deviceCity: deviceLocation.city,
      deviceTimezone: deviceLocation.timezone,
    })

    const isNewDevice = !(await this.sessionsRepository.existsDevice(session))

    const accessExpiresAt = new Date(now.getTime() + this.accessTtlMilliseconds)
    const accessToken = await this.tokenGenerator.generateAccessToken(user.id.toString(), sessionId.toString(), accessExpiresAt, now)

    await this.saveSuccessfulLogin(credentials, user, session, isNewDevice, deviceLocation, now)

    return success({
      accessToken,
      refreshToken: clearSessionToken,
      sessionId: sessionId.toString(),
      accessTokenExpiresAt: accessExpiresAt,
      refreshTokenExpiresAt: sessionExpiresAt,
      isNewDevice,
    })
  }

  private validateUserEmail(email: string): Result<UserEmail, LoginUserApplicationError> {
    try {
      return success(UserEmail.fromString(email))
    } catch {
      return fail(LoginUserApplicationError.invalidUserEmail(email))
    }
  }

  private async getAndValidateUserWithCredentials(userEmail: UserEmail): Promise<Result<User, LoginUserApplicationError>> {
    const userWithCredentials = await this.usersRepository.findByEmailWithCredentials(userEmail.toString())

    if (!userWithCredentials) {
      return fail(LoginUserApplicationError.userNotFound(userEmail.toString()))
    }

    if (userWithCredentials.deletedAt || !userWithCredentials.status.equals(UserStatus.active())) {
      return fail(LoginUserApplicationError.userNotFound(userEmail.toString()))
    }

    if (!userWithCredentials.credential) {
      return fail(LoginUserApplicationError.userDoesNotHaveCredentials(userWithCredentials.id.toString()))
    }

    return success(userWithCredentials)
  }

  private validateUserAgent(userAgent: string, userEmail: UserEmail): UserAgent {
    try {
      return UserAgent.fromString(userAgent)
    } catch {
      this.loggerService.warn('UA invalid, using fallback', {
        userEmail: userEmail.toString(),
        uaSample: userAgent.slice(0, 512),
        uaLength: userAgent.length,
      })

      return UserAgent.unknown()
    }
  }

  private async validateAndHashIp(ip: string, userAgent: UserAgent, user: User): Promise<NormalizedIpWithHash | null> {
    let sessionIpHash: UserSessionIpHash | null = null
    let normalizedIp: string = ip

    if (this.ipValidator.isValid(ip) && this.ipValidator.isPublic(ip)) {
      normalizedIp = this.ipValidator.normalize(ip)

      const ipHash = await this.hasherService.hash(normalizedIp)

      sessionIpHash = UserSessionIpHash.fromString(ipHash)

      return {
        normalizedIp,
        hashedIp: sessionIpHash,
      }
    }

    this.loggerService.warn('IP invalid', {
      userId: user.id.toString(),
      userAgent: userAgent.toString(),
      userIp: ip.slice(0, 39),
    })

    return null
  }

  private async resolveDeviceLocation(
    normalizedIp: string | null,
    userEmail: UserEmail,
    userAgent: UserAgent,
  ): Promise<ResolvedDeviceLocation> {
    let country: string | null = null
    let city: string | null = null
    let timezone: string | null = null

    if (normalizedIp) {
      try {
        const deviceLocation = await this.deviceLocationResolver.resolve(normalizedIp)

        if (deviceLocation) {
          country = deviceLocation.country
          city = deviceLocation.city
          timezone = deviceLocation.timezone
        }
      } catch (exception: unknown) {
        const error = exception instanceof Error ? exception : new Error(String(exception))

        this.loggerService.error('Device location resolver failed', error.stack, {
          userEmail: userEmail.toString(),
          ip: normalizedIp,
          userAgent: userAgent.toString(),
        })
      }
    }

    return {
      country,
      city,
      timezone,
    }
  }

  private async validateCredentials(
    credentials: UserCredential,
    password: string,
    user: User,
    ipHash: UserSessionIpHash | null,
    userAgent: UserAgent,
    deviceLocation: ResolvedDeviceLocation,
    now: Date,
  ): Promise<Result<void, LoginUserApplicationError>> {
    const passwordMatches = await this.passwordHasher.compare(password, credentials.passwordHash.toString())

    if (!passwordMatches) {
      //TODO: This might need be changed when locks mechanism is implemented
      //credentials.incrementFailedAttempts(now)

      //const lockUntil = this.lockoutPolicy.evaluateLock(credentials, now)

      //if (lockUntil) {
      //credentials.lock(lockUntil, now)
      //}

      await this.unitOfWork.runInTransaction(async (ctx) => {
        //await this.credentialsRepository.saveFailedAttempts(credentials, ctx)

        //if (lockUntil) {
        //await this.credentialsRepository.saveLock(credentials, ctx)
        //}

        const domainEvent = DomainEvent.create(
          DomainEventId.fromString(this.idGeneratorService.generateId()),
          DomainEventName.failedLoginAttempt(),
          DomainEventAggregateType.user(),
          DomainEventAggregateId.fromString(user.id.toString()),
          {
            userId: user.id.toString(),
            country: deviceLocation.country,
            city: deviceLocation.city,
            timezone: deviceLocation.timezone,
          },
          {
            ipHash: ipHash ? ipHash.toString() : null,
            ua: userAgent.toString(),
          },
          now,
        )

        await this.domainEventRepository.save(domainEvent, ctx)
      })

      return fail(LoginUserApplicationError.invalidCredentials(user.id.toString()))
    }

    return success(undefined)
  }

  private async saveSuccessfulLogin(
    credentials: UserCredential,
    user: User,
    session: UserSession,
    isNewDevice: boolean,
    deviceLocation: ResolvedDeviceLocation,
    now: Date,
  ): Promise<void> {
    await this.unitOfWork.runInTransaction(async (ctx) => {
      await this.credentialsRepository.saveLoginSuccess(credentials, ctx)

      await this.sessionsRepository.revokeOldestAndSave(session, this.maxSessionsPolicy.maxSessions, ctx)

      const domainEvent = DomainEvent.create(
        DomainEventId.fromString(this.idGeneratorService.generateId()),
        DomainEventName.successfulLogin(),
        DomainEventAggregateType.user(),
        DomainEventAggregateId.fromString(user.id.toString()),
        {
          userId: user.id.toString(),
          sessionId: session.id.toString(),
          isNewDevice,
          country: deviceLocation.country,
          city: deviceLocation.city,
          timezone: deviceLocation.timezone,
        },
        {
          ipHash: session.ipHash ? session.ipHash.toString() : null,
          ua: session.userAgent.toString(),
        },
        now,
      )

      await this.domainEventRepository.save(domainEvent, ctx)
    })
  }
}
