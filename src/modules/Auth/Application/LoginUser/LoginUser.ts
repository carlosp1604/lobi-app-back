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
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { DomainEventId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventId'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { UserSessionPolicyManagerApplicationError } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationError'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { UserPassword } from '~/src/modules/Auth/Domain/ValueObject/UserPassword'
import { UserCredentialDomainException } from '~/src/modules/Auth/Domain/UserCredentialDomainException'

export class LoginUser {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly credentialRepository: UserCredentialRepositoryInterface,
    private readonly sessionRepository: UserSessionRepositoryInterface,
    private readonly domainEventRepository: DomainEventRepositoryInterface,
    private readonly passwordHasher: PasswordHasherServiceInterface,
    private readonly generateTokensService: GenerateTokensApplicationService,
    private readonly userSessionManagerService: UserSessionPolicyManagerApplicationService,
    private readonly requestOriginApplicationService: RequestOriginApplicationService,
    private readonly clockService: ClockServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly loggerService: LoggerServiceInterface,
    private readonly idGeneratorService: IdGeneratorServiceInterface,
  ) {}

  public async execute(
    request: LoginUserApplicationRequestDto,
  ): Promise<Result<LoginUserApplicationResponseDto, LoginUserApplicationError>> {
    const now = this.clockService.now()

    const validateUserEmailResult = this.validateUserEmail(request.email)
    const validateUserPasswordResult = this.validatePassword(request.password)

    if (!validateUserEmailResult.success) {
      return validateUserEmailResult
    }

    if (!validateUserPasswordResult.success) {
      return validateUserPasswordResult
    }

    const userEmail = validateUserEmailResult.value
    const userPassword = validateUserPasswordResult.value

    const { userAgent, ipHash, deviceLocation } = await this.requestOriginApplicationService.process(request.ip, request.userAgent, {
      email: userEmail.value,
    })

    let sessionIpHash: UserSessionIpHash | null = null

    if (ipHash) {
      sessionIpHash = UserSessionIpHash.fromString(ipHash)
    }

    return this.unitOfWork.runInTransaction(async (context) => {
      const getAndValidateUserResult = await this.getAndValidateUser(userEmail, context)

      if (!getAndValidateUserResult.success) {
        return getAndValidateUserResult
      }

      const user: User = getAndValidateUserResult.value

      const getUserCredential = await this.getUserCredential(user, context)

      if (!getUserCredential.success) {
        return getUserCredential
      }

      const credentials = getUserCredential.value

      const passwordMatches = await this.passwordHasher.compare(userPassword.value, credentials.passwordHash.value)

      if (!passwordMatches) {
        const domainEvent = this.buildFailedAttemptDomainEvent(user.id, deviceLocation, sessionIpHash, userAgent, now)

        await this.domainEventRepository.save(domainEvent, context)

        return fail(LoginUserApplicationError.invalidCredentials(user.id.value))
      }

      credentials.resetAfterSuccessfulLogin(now)

      const { session, accessToken, refreshToken, refreshTokenExpiresAt, accessTokenExpiresAt } =
        await this.generateTokensService.generate(user.id, now, userAgent, sessionIpHash, deviceLocation)

      const activeSessions = await this.sessionRepository.findUserActiveSessions(user.id.value, now, context)

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

      await this.credentialRepository.update(credentials, context)

      await this.domainEventRepository.save(domainEvent, context)

      return success({
        accessToken,
        refreshToken,
        sessionId: session.id.value,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        isNewDevice,
      })
    })
  }

  private validateUserEmail(email: string): Result<UserEmail, LoginUserApplicationError> {
    try {
      return success(UserEmail.fromString(email))
    } catch (exception: unknown) {
      if (!(exception instanceof UserDomainException)) {
        throw exception
      }

      return fail(LoginUserApplicationError.invalidUserEmail(email))
    }
  }

  private validatePassword(password: string): Result<UserPassword, LoginUserApplicationError> {
    try {
      return success(UserPassword.fromString(password))
    } catch (exception: unknown) {
      if (!(exception instanceof UserCredentialDomainException)) {
        throw exception
      }

      return fail(LoginUserApplicationError.invalidPasswordFormat())
    }
  }

  private async getAndValidateUser(
    userEmail: EmailAddressValueObject,
    context: TxContext,
  ): Promise<Result<User, LoginUserApplicationError>> {
    const user = await this.userRepository.findByEmailWithLock(userEmail.value, context)

    if (!user || !user.isActive()) {
      this.loggerService.warn('Login attempt failed: User not found or inactive', {
        email: userEmail.value,
        reason: user ? 'Inactive' : 'NotFound',
      })

      return fail(LoginUserApplicationError.userNotFound(userEmail.value))
    }

    return success(user)
  }

  private async getUserCredential(user: User, context: TxContext): Promise<Result<UserCredential, LoginUserApplicationError>> {
    const userCredential = await this.credentialRepository.findByUserId(user.id.value, context)

    if (!userCredential) {
      this.loggerService.error('Login failed: User exists but has no credentials', undefined, {
        userId: user.id.value,
        email: user.email.value,
      })

      return fail(LoginUserApplicationError.userDoesNotHaveCredentials(user.id.value))
    }

    return success(userCredential)
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
      DomainEventAggregateId.fromString(userId.value),
      {
        userId: userId.value,
        deviceLocation: deviceLocation
          ? {
              city: deviceLocation.city,
              countryCode: deviceLocation.countryCode,
            }
          : null,
      },
      {
        ipHash: ipHash ? ipHash.value : null,
        ua: userAgent.value,
      },
      now,
    )
  }

  private buildSuccessfulLoginDomainEvent(session: UserSession, isNewDevice: boolean, now: Date): DomainEvent {
    return DomainEvent.create(
      DomainEventId.fromString(this.idGeneratorService.generateId()),
      DomainEventName.successfulLogin(),
      DomainEventAggregateType.user(),
      DomainEventAggregateId.fromString(session.userId.value),
      {
        userId: session.userId.value,
        deviceLocation: session.deviceLocation
          ? {
              city: session.deviceLocation.city,
              countryCode: session.deviceLocation.countryCode,
            }
          : null,
        sessionId: session.id.value,
        isNewDevice,
      },
      {
        ipHash: session.ipHash ? session.ipHash.value : null,
        ua: session.userAgent.value,
      },
      now,
    )
  }
}
