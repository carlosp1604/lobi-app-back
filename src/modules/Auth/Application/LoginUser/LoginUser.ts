import { EmailAddressValueObject } from '~/src/modules/Shared/Domain/ValueObject/EmailAddressValueObject'
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
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { DomainEventId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventId'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { IpValidatorServiceInterface } from '~/src/modules/Auth/Domain/IpValidatorServiceInterface'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { UserSessionPolicyManagerApplicationError } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationError'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'

interface NormalizedIpWithHash {
  normalizedIp: string
  hashedIp: UserSessionIpHash
}

export class LoginUser {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly credentialRepository: UserCredentialRepositoryInterface,
    private readonly sessionRepository: UserSessionRepositoryInterface,
    private readonly domainEventRepository: DomainEventRepositoryInterface,
    private readonly passwordHasher: PasswordHasherServiceInterface,
    private readonly generateTokensService: GenerateTokensApplicationService,
    private readonly userSessionManagerService: UserSessionPolicyManagerApplicationService,
    private readonly hasherService: HasherServiceInterface,
    private readonly deviceLocationResolver: DeviceLocationResolverServiceInterface,
    private readonly clockService: ClockServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly loggerService: LoggerServiceInterface,
    private readonly idGeneratorService: IdGeneratorServiceInterface,
    private readonly ipValidator: IpValidatorServiceInterface,
  ) {}

  public async execute(
    request: LoginUserApplicationRequestDto,
  ): Promise<Result<LoginUserApplicationResponseDto, LoginUserApplicationError>> {
    const now = this.clockService.now()

    const validateUserEmailResult = this.validateUserEmail(request.email)

    if (!validateUserEmailResult.success) {
      return validateUserEmailResult
    }

    const userEmail = validateUserEmailResult.value
    const userAgent = this.validateUserAgent(request.userAgent, userEmail)

    return this.unitOfWork.runInTransaction(async (context) => {
      const getAndValidateUserResult = await this.getAndValidateUser(userEmail, context)

      if (!getAndValidateUserResult.success) {
        return getAndValidateUserResult
      }

      const user: User = getAndValidateUserResult.value

      const getUserCredential = await this.getUserCredential(user.id, context)

      if (!getUserCredential.success) {
        return getUserCredential
      }

      const credentials = getUserCredential.value

      const validateAndHashIpResult = await this.validateAndHashIp(request.ip, userAgent, user)

      let sessionIpHash: UserSessionIpHash | null = null
      let normalizedIp: string | null = null

      if (validateAndHashIpResult) {
        sessionIpHash = validateAndHashIpResult.hashedIp
        normalizedIp = validateAndHashIpResult.normalizedIp
      }

      const deviceLocation = await this.resolveDeviceLocation(normalizedIp, userEmail, userAgent)

      const passwordMatches = await this.passwordHasher.compare(request.password, credentials.passwordHash.toString())

      if (!passwordMatches) {
        const domainEvent = this.buildFailedAttemptDomainEvent(user.id, deviceLocation, sessionIpHash, userAgent, now)

        await this.domainEventRepository.save(domainEvent, context)

        return fail(LoginUserApplicationError.invalidCredentials(user.id.toString()))
      }

      credentials.resetAfterSuccessfulLogin(now)

      const { session, accessToken, refreshToken, refreshTokenExpiresAt, accessTokenExpiresAt } =
        await this.generateTokensService.generate(user.id, now, userAgent, sessionIpHash, deviceLocation)

      const activeSessions = await this.sessionRepository.findUserActiveSessions(user.id.toString(), now, context)

      const isNewDevice = !activeSessions.find((activeSession) => activeSession.isSameDeviceAs(session))

      const serviceResult = this.userSessionManagerService.applyPolicyAndRevokeForLogin(activeSessions, now)

      if (!serviceResult.success) {
        if (serviceResult.error.id === UserSessionPolicyManagerApplicationError.revocationFailedId) {
          return fail(LoginUserApplicationError.revocationFailed(serviceResult.error.message))
        }

        return fail(LoginUserApplicationError.internalError(`Unknown internal error: ${serviceResult.error.message}`))
      }

      const sessionsToRevoke = serviceResult.value

      const domainEvent = this.buildSuccessfulLoginDomainEvent(session, isNewDevice, now)

      await this.sessionRepository.save([...sessionsToRevoke, session], context)

      await this.credentialRepository.saveLoginSuccess(credentials, context)

      await this.domainEventRepository.save(domainEvent, context)

      return success({
        accessToken,
        refreshToken,
        sessionId: session.id.toString(),
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        isNewDevice,
      })
    })
  }

  private validateUserEmail(email: string): Result<UserEmail, LoginUserApplicationError> {
    try {
      return success(UserEmail.fromString(email))
    } catch {
      return fail(LoginUserApplicationError.invalidUserEmail(email))
    }
  }

  private async getAndValidateUser(
    userEmail: EmailAddressValueObject,
    context: TxContext,
  ): Promise<Result<User, LoginUserApplicationError>> {
    const user = await this.userRepository.findByEmailWithLock(userEmail.toString(), context)

    if (!user) {
      return fail(LoginUserApplicationError.userNotFound(userEmail.toString()))
    }

    if (user.deletedAt || !user.status.equals(UserStatus.active())) {
      return fail(LoginUserApplicationError.userNotFound(userEmail.toString()))
    }

    return success(user)
  }

  private async getUserCredential(userId: UserId, context: TxContext): Promise<Result<UserCredential, LoginUserApplicationError>> {
    const userCredential = await this.credentialRepository.findByUserId(userId.toString(), context)

    if (!userCredential) {
      return fail(LoginUserApplicationError.userDoesNotHaveCredentials(userId.toString()))
    }

    return success(userCredential)
  }

  private validateUserAgent(userAgent: string, userEmail: EmailAddressValueObject): UserAgent {
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
    userEmail: EmailAddressValueObject,
    userAgent: UserAgent,
  ): Promise<DeviceLocation | null> {
    if (normalizedIp) {
      try {
        const resolvedDeviceLocation = await this.deviceLocationResolver.resolve(normalizedIp)

        if (!resolvedDeviceLocation) {
          return null
        }

        return DeviceLocation.fromProps({ city: resolvedDeviceLocation.city, countryCode: resolvedDeviceLocation.countryCode })
      } catch (exception: unknown) {
        const stack = exception instanceof Error ? exception.stack : undefined

        this.loggerService.error('Device location resolver failed', stack, {
          userEmail: userEmail.toString(),
          ip: normalizedIp,
          userAgent: userAgent.toString(),
          error: exception,
        })
      }
    }

    return null
  }

  private buildFailedAttemptDomainEvent(
    userId: UserId,
    deviceLocation: DeviceLocation | null,
    ipHash: UserSessionIpHash | null,
    userAgent: UserAgent,
    now: Date,
  ): DomainEvent {
    return DomainEvent.create(
      DomainEventId.fromString(this.idGeneratorService.generateId()),
      DomainEventName.failedLoginAttempt(),
      DomainEventAggregateType.user(),
      DomainEventAggregateId.fromString(userId.toString()),
      {
        userId: userId.toString(),
        deviceLocation: deviceLocation
          ? {
              city: deviceLocation.city,
              countryCode: deviceLocation.countryCode,
            }
          : null,
      },
      {
        ipHash: ipHash ? ipHash.toString() : null,
        ua: userAgent.toString(),
      },
      now,
    )
  }

  private buildSuccessfulLoginDomainEvent(session: UserSession, isNewDevice: boolean, now: Date): DomainEvent {
    return DomainEvent.create(
      DomainEventId.fromString(this.idGeneratorService.generateId()),
      DomainEventName.successfulLogin(),
      DomainEventAggregateType.user(),
      DomainEventAggregateId.fromString(session.userId.toString()),
      {
        userId: session.userId.toString(),
        deviceLocation: session.deviceLocation
          ? {
              city: session.deviceLocation.city,
              countryCode: session.deviceLocation.countryCode,
            }
          : null,
        sessionId: session.id.toString(),
        isNewDevice,
      },
      {
        ipHash: session.ipHash ? session.ipHash.toString() : null,
        ua: session.userAgent.toString(),
      },
      now,
    )
  }
}
