import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { RefreshSessionApplicationResponseDto } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationResponseDto'
import { RefreshSessionApplicationRequestDto } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationRequestDto'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { success, fail, Result } from '~/src/modules/Shared/Domain/Result'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { User } from '~/src/modules/User/Domain/User'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { RefreshSessionApplicationError } from '~/src/modules/Auth/Application/RefreshSession/RefreshSessionApplicationError'
import { UserSessionPolicyManagerApplicationService } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationService'
import { UserSessionPolicyManagerApplicationError } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationError'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'

export class RefreshSession {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly userRepository: UserRepositoryInterface,
    private readonly sessionRepository: UserSessionRepositoryInterface,
    private readonly generateTokensService: GenerateTokensApplicationService,
    private readonly userSessionManagerService: UserSessionPolicyManagerApplicationService,
    private readonly hasherService: HasherServiceInterface,
    private readonly clockService: ClockServiceInterface,
  ) {}

  public async execute(
    request: RefreshSessionApplicationRequestDto,
  ): Promise<Result<RefreshSessionApplicationResponseDto, RefreshSessionApplicationError>> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const now = this.clockService.now()

      const findAndValidateSessionResult = await this.findAndValidateSession(request.refreshToken, context, now)

      if (!findAndValidateSessionResult.success) {
        return findAndValidateSessionResult
      }

      const currentSession = findAndValidateSessionResult.value

      const findAndValidateUserResult = await this.findAndValidateUser(currentSession, context)

      if (!findAndValidateUserResult.success) {
        return findAndValidateUserResult
      }

      const user = findAndValidateUserResult.value

      const { userAgent, ipHash, deviceLocation } = currentSession
      const { session, accessToken, refreshToken, refreshTokenExpiresAt, accessTokenExpiresAt } =
        await this.generateTokensService.generate(user.id, now, userAgent, ipHash, deviceLocation)

      const refreshSessionResult = await this.refreshSession(currentSession, session, user.id, now, context)

      if (!refreshSessionResult.success) {
        return refreshSessionResult
      }

      return success({
        accessToken,
        refreshToken,
        sessionId: session.id.toString(),
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
      })
    })
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
      return fail(RefreshSessionApplicationError.sessionAlreadyRevoked(sessionFound.id.toString()))
    }

    if (sessionFound.isExpired(now)) {
      return fail(RefreshSessionApplicationError.sessionAlreadyExpired(sessionFound.id.toString()))
    }

    return success(sessionFound)
  }

  private async findAndValidateUser(
    userSession: UserSession,
    context: TxContext,
  ): Promise<Result<User, RefreshSessionApplicationError>> {
    const user = await this.userRepository.findByIdWithLock(userSession.userId.toString(), context)

    if (!user) {
      return fail(RefreshSessionApplicationError.userNotFound(userSession.userId.toString()))
    }

    if (user.deletedAt || !user.status.equals(UserStatus.active())) {
      return fail(RefreshSessionApplicationError.userNotFound(userSession.userId.toString()))
    }

    return success(user)
  }

  private async refreshSession(
    currentSession: UserSession,
    newSession: UserSession,
    userId: UserId,
    now: Date,
    context: TxContext,
  ): Promise<Result<void, RefreshSessionApplicationError>> {
    const activeSessions = await this.sessionRepository.findUserActiveSessions(userId.toString(), now, context)

    const serviceResult = this.userSessionManagerService.applyPolicyAndRevokeForRefresh(currentSession, activeSessions, now)

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
