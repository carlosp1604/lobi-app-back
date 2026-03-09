import { User } from '~/src/modules/User/Domain/User'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { LoginUserApplicationRequestDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationRequestDto'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { LoginUserApplicationResponseDto } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationResponseDto'
import { LoginUserApplicationError } from '~/src/modules/Auth/Application/LoginUser/LoginUserApplicationError'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { UserSessionPolicyManagerApplicationError } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationError'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { UserPassword } from '~/src/modules/Auth/Domain/ValueObject/UserPassword'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'

export class LoginUser {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly credentialRepository: UserCredentialRepositoryInterface,
    private readonly sessionRepository: UserSessionRepositoryInterface,
    private readonly domainEventRepository: DomainEventRepositoryInterface,
    private readonly hasherService: HasherServiceInterface,
    private readonly generateTokensService: GenerateTokensApplicationService,
    private readonly userSessionManagerService: UserSessionPolicyManagerApplicationService,
    private readonly requestOriginApplicationService: RequestOriginApplicationService,
    private readonly clockService: ClockServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly loggerService: LoggerServiceInterface,
    private readonly authDomainEventFactory: AuthDomainEventFactory,
  ) {}

  public async execute(
    request: LoginUserApplicationRequestDto,
  ): Promise<Result<LoginUserApplicationResponseDto, LoginUserApplicationError>> {
    const now = this.clockService.now()

    const validateUserEmailResult = this.validateEmail(request.email)
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

      const passwordMatches = await this.hasherService.compare(userPassword.value, credentials.passwordHash.value)

      if (!passwordMatches) {
        const domainEvent = this.authDomainEventFactory.createFailedAttemptEvent(user.id, deviceLocation, userAgent, ipHash, now)

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

      const domainEvent = this.authDomainEventFactory.createSuccessfulLoginEvent(session, isNewDevice, now)

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

  private validateEmail(email: string): Result<EmailAddress, LoginUserApplicationError> {
    const emailResult = EmailAddress.safeCreate(email)

    if (!emailResult.success) {
      return fail(LoginUserApplicationError.invalidUserEmail(email))
    }

    return success(emailResult.value)
  }

  private validatePassword(password: string): Result<UserPassword, LoginUserApplicationError> {
    const passwordResult = UserPassword.safeCreate(password)

    if (!passwordResult.success) {
      return fail(LoginUserApplicationError.invalidPasswordFormat())
    }

    return success(passwordResult.value)
  }

  private async getAndValidateUser(userEmail: EmailAddress, context: TxContext): Promise<Result<User, LoginUserApplicationError>> {
    const user = await this.userRepository.findByEmailWithLock(userEmail.value, context)

    if (!user || !user.isActive()) {
      this.loggerService.warn('Login rejected', {
        email: userEmail.value,
        reason: user ? 'User is disabled' : 'User not found',
      })

      return fail(LoginUserApplicationError.userNotFound(userEmail.value))
    }

    return success(user)
  }

  private async getUserCredential(user: User, context: TxContext): Promise<Result<UserCredential, LoginUserApplicationError>> {
    const userCredential = await this.credentialRepository.findByUserId(user.id.value, context)

    if (!userCredential) {
      this.loggerService.error('Inconsistent state', undefined, {
        userId: user.id.value,
        email: user.email.value,
        reason: 'Active user has no credentials',
      })

      return fail(LoginUserApplicationError.userDoesNotHaveCredentials(user.id.value))
    }

    return success(userCredential)
  }
}
