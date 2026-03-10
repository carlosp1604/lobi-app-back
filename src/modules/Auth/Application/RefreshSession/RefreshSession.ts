import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { RefreshSessionApplicationResponseDto } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationResponseDto'
import { RefreshSessionApplicationRequestDto } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationRequestDto'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { success, fail, Result } from '~/src/modules/Shared/Domain/Result'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { User } from '~/src/modules/User/Domain/User'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { RefreshSessionApplicationError } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationError'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { UserSessionPolicyManagerApplicationError } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationError'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'

export class RefreshSession {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly sessionRepository: UserSessionRepositoryInterface,
    private readonly hasherService: HasherServiceInterface,
    private readonly generateTokensService: GenerateTokensApplicationService,
    private readonly userSessionManagerService: UserSessionPolicyManagerApplicationService,
    private readonly requestOriginApplicationService: RequestOriginApplicationService,
    private readonly clockService: ClockServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly loggerService: LoggerServiceInterface,
  ) {}

  public async execute(
    request: RefreshSessionApplicationRequestDto,
  ): Promise<Result<RefreshSessionApplicationResponseDto, RefreshSessionApplicationError>> {
    const validateTokenResult = this.validateToken(request.token)

    if (!validateTokenResult.success) {
      return validateTokenResult
    }

    const validatedToken = validateTokenResult.value

    const { userAgent, ipHash, deviceLocation } = await this.requestOriginApplicationService.process(request.ip, request.userAgent)

    let sessionIpHash: UserSessionIpHash | null = null

    if (ipHash) {
      sessionIpHash = UserSessionIpHash.fromString(ipHash)
    }

    return this.unitOfWork.runInTransaction(async (context) => {
      const now = this.clockService.now()

      const findAndValidateSessionResult = await this.findAndValidateSession(validatedToken, context, now)

      if (!findAndValidateSessionResult.success) {
        return findAndValidateSessionResult
      }

      const currentSession = findAndValidateSessionResult.value

      const findAndValidateUserResult = await this.findAndValidateUser(currentSession, context)

      if (!findAndValidateUserResult.success) {
        return findAndValidateUserResult
      }

      const user = findAndValidateUserResult.value

      const { session, accessToken, refreshToken, refreshTokenExpiresAt, accessTokenExpiresAt } =
        await this.generateTokensService.generate(user.id, now, userAgent, sessionIpHash, deviceLocation)

      const refreshSessionResult = await this.refreshSession(currentSession, session, user.id, now, context)

      if (!refreshSessionResult.success) {
        return refreshSessionResult
      }

      return success({
        accessToken,
        refreshToken,
        sessionId: session.id.value,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
      })
    })
  }

  private validateToken(token: string): Result<string, RefreshSessionApplicationError> {
    const TOKEN_FORMAT = /^[A-Za-z0-9+/=]+$/
    const minLength = 40
    const maxLength = 100

    if (token.length < minLength || token.length > maxLength || !TOKEN_FORMAT.test(token)) {
      return fail(RefreshSessionApplicationError.invalidTokenFormat())
    }

    return success(token)
  }

  private async findAndValidateSession(
    token: string,
    context: TxContext,
    now: Date,
  ): Promise<Result<UserSession, RefreshSessionApplicationError>> {
    const hashedToken = await this.hasherService.hash(token)

    const sessionFound = await this.sessionRepository.findByHash(hashedToken, context)

    if (!sessionFound) {
      return fail(RefreshSessionApplicationError.sessionNotFound())
    }

    if (sessionFound.isRevoked()) {
      this.loggerService.warn('Session refresh rejected', {
        sessionId: sessionFound.id.value,
        userId: sessionFound.userId.value,
        reason: 'Session has been revoked',
      })
      return fail(RefreshSessionApplicationError.sessionAlreadyRevoked(sessionFound.id.value))
    }

    if (sessionFound.isExpired(now)) {
      this.loggerService.warn('Session refresh rejected', {
        sessionId: sessionFound.id.value,
        userId: sessionFound.userId.value,
        reason: 'Session has expired',
      })
      return fail(RefreshSessionApplicationError.sessionAlreadyExpired(sessionFound.id.value))
    }

    return success(sessionFound)
  }

  private async findAndValidateUser(
    userSession: UserSession,
    context: TxContext,
  ): Promise<Result<User, RefreshSessionApplicationError>> {
    const user = await this.userRepository.findByIdWithLock(userSession.userId.value, context)

    if (!user || !user.isActive()) {
      this.loggerService.error('Inconsistent state', undefined, {
        userId: userSession.userId.value,
        sessionId: userSession.id.value,
        reason: user ? 'User is disabled' : 'User not found',
      })

      return fail(RefreshSessionApplicationError.userNotFound(userSession.userId.value))
    }

    return success(user)
  }

  private async refreshSession(
    currentSession: UserSession,
    newSession: UserSession,
    userId: Identifier,
    now: Date,
    context: TxContext,
  ): Promise<Result<void, RefreshSessionApplicationError>> {
    const activeSessions = await this.sessionRepository.findUserActiveSessions(userId, now, context)

    const serviceResult = this.userSessionManagerService.applyPolicyAndRevokeForRefresh(currentSession.id, userId, activeSessions, now)

    if (!serviceResult.success) {
      if (serviceResult.error.id === UserSessionPolicyManagerApplicationError.sessionsInconsistencyId) {
        return fail(RefreshSessionApplicationError.sessionInconsistency(serviceResult.error.message))
      }

      if (serviceResult.error.id === UserSessionPolicyManagerApplicationError.revocationFailedId) {
        return fail(RefreshSessionApplicationError.revocationFailed(serviceResult.error.message))
      }

      return fail(RefreshSessionApplicationError.internalError(`Unknown internal error: ${serviceResult.error.message}`))
    }

    const sessionsToRevoke = serviceResult.value

    await this.sessionRepository.save([...sessionsToRevoke, newSession], context)

    return success(undefined)
  }
}
