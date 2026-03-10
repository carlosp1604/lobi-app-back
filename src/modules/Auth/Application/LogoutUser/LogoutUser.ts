import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { LogoutUserApplicationError } from '~/src/modules/Auth/Application/LogoutUser/LogoutUserApplicationError'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { LogoutUserApplicationRequestDto } from '~/src/modules/Auth/Application/LogoutUser/LogoutUserApplicationRequestDto'

export class LogoutUser {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly sessionRepository: UserSessionRepositoryInterface,
    private readonly clockService: ClockServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly loggerService: LoggerServiceInterface,
  ) {}

  public async execute(request: LogoutUserApplicationRequestDto): Promise<Result<void, LogoutUserApplicationError>> {
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
        this.loggerService.error('Inconsistent state', undefined, {
          userId: request.userId,
          sessionId: request.sessionId,
          reason: 'Valid JWT references a non-existent session',
        })

        return fail(LogoutUserApplicationError.sessionNotFound(sessionId.value))
      }

      if (session.userId.value !== request.userId) {
        this.loggerService.error('Inconsistent state', undefined, {
          requestedUserId: request.userId,
          actualSessionOwner: session.userId.value,
          sessionId: request.sessionId,
          reason: 'Session owner mismatch during logout',
        })

        return fail(LogoutUserApplicationError.sessionDoesNotBelongToUser(sessionId.value, userId.value))
      }

      const canRevokeResult = session.canBeRevoked(now)

      if (!canRevokeResult.success) {
        this.loggerService.warn('Logout rejected', {
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
    request: LogoutUserApplicationRequestDto,
  ): Result<{ userId: Identifier; sessionId: Identifier }, LogoutUserApplicationError> {
    const userIdResult = Identifier.safeCreate(request.userId)
    const sessionIdResult = Identifier.safeCreate(request.sessionId)

    if (!userIdResult.success) {
      this.loggerService.error('Inconsistent state', userIdResult.error.stack, {
        rawUserId: request.userId.slice(0, 60),
        reason: 'Valid JWT contains malformed identifiers',
        message: userIdResult.error.message,
      })
    }

    if (!sessionIdResult.success) {
      this.loggerService.error('Inconsistent state', sessionIdResult.error.stack, {
        rawSessionId: request.sessionId.slice(0, 60),
        reason: 'Valid JWT contains malformed identifiers',
        message: sessionIdResult.error.message,
      })
    }

    if (!userIdResult.success || !sessionIdResult.success) {
      return fail(LogoutUserApplicationError.invalidInput())
    }

    return success({
      userId: userIdResult.value,
      sessionId: sessionIdResult.value,
    })
  }
}
