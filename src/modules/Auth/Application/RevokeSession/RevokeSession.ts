import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { RevokeSessionApplicationError } from '~/src/modules/Auth/Application/RevokeSession/RevokeSessionApplicationError'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { RevokeSessionApplicationRequestDto } from '~/src/modules/Auth/Application/RevokeSession/RevokeSessionApplicationRequestDto'

export class RevokeSession {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly sessionRepository: UserSessionRepositoryInterface,
    private readonly clockService: ClockServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly loggerService: LoggerServiceInterface,
  ) {}

  public async execute(request: RevokeSessionApplicationRequestDto): Promise<Result<void, RevokeSessionApplicationError>> {
    const now = this.clockService.now()

    const inputValidationResult = this.validateInput(request)
    if (!inputValidationResult.success) {
      return inputValidationResult
    }

    const { userId, sessionId } = inputValidationResult.value

    return this.unitOfWork.runInTransaction(async (context) => {
      const user = await this.userRepository.findByIdWithLock(userId.value, context)

      if (!user || !user.isActive()) {
        this.loggerService.warn('Inconsistent state', {
          userId: request.userId,
          reason: user ? 'User is disabled' : 'User not found',
        })

        return success(undefined)
      }

      const session = await this.sessionRepository.findById(sessionId, context)

      if (!session) {
        this.loggerService.warn('Session revocation failed', {
          userId: request.userId,
          sessionId: request.sessionId,
          reason: 'Session not found',
        })

        return fail(RevokeSessionApplicationError.sessionNotFound(sessionId.value))
      }

      if (session.userId.value !== request.userId) {
        this.loggerService.warn('Session revocation rejected', {
          requestedUserId: request.userId,
          actualSessionOwner: session.userId.value,
          sessionId: request.sessionId,
          reason: 'Session owner mismatch',
        })

        return fail(RevokeSessionApplicationError.sessionDoesNotBelongToUser(sessionId.value, userId.value))
      }

      const canRevokeResult = session.canBeRevoked(now)

      if (!canRevokeResult.success) {
        this.loggerService.warn('Session revocation rejected', {
          userId: request.userId,
          sessionId: request.sessionId,
          reason: canRevokeResult.error.message,
        })

        return success(undefined)
      }

      session.revoke(now)

      await this.sessionRepository.save([session], context)

      return success(undefined)
    })
  }

  private validateInput(
    request: RevokeSessionApplicationRequestDto,
  ): Result<{ userId: Identifier; sessionId: Identifier }, RevokeSessionApplicationError> {
    const userIdResult = Identifier.safeCreate(request.userId)
    const sessionIdResult = Identifier.safeCreate(request.sessionId)

    if (!userIdResult.success || !sessionIdResult.success) {
      return fail(RevokeSessionApplicationError.invalidInput())
    }

    return success({
      userId: userIdResult.value,
      sessionId: sessionIdResult.value,
    })
  }
}
