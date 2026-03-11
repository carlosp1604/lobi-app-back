import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'
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

      if (!user) {
        this.loggerService.warn('Inconsistent state', {
          userId: userId.value,
          reason: 'User not found',
        })

        return fail(RevokeSessionApplicationError.userNotFound(userId.value))
      }

      if (!user.isActive()) {
        this.loggerService.warn('Inconsistent state', {
          userId: userId.value,
          reason: 'User is disabled',
        })

        return fail(RevokeSessionApplicationError.userDisabled(userId.value))
      }

      const session = await this.sessionRepository.findById(sessionId, context)

      if (!session) {
        this.loggerService.warn('Session revocation failed', {
          userId: userId.value,
          sessionId: sessionId.value,
          reason: 'Session not found',
        })

        return fail(RevokeSessionApplicationError.sessionNotFound(sessionId.value))
      }

      if (!session.userId.equals(user.id)) {
        this.loggerService.warn('Session revocation rejected', {
          requestedUserId: userId.value,
          actualSessionOwner: session.userId.value,
          sessionId: sessionId.value,
          reason: 'Session owner mismatch',
        })

        return fail(RevokeSessionApplicationError.sessionDoesNotBelongToUser(sessionId.value, userId.value))
      }

      const canRevokeResult = session.canBeRevoked(now)

      if (!canRevokeResult.success) {
        this.loggerService.warn('Session revocation rejected', {
          userId: userId.value,
          sessionId: sessionId.value,
          reason: canRevokeResult.error.message,
        })

        return fail(RevokeSessionApplicationError.cannotRevokeSession(canRevokeResult.error.message))
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

    if (!userIdResult.success) {
      const safeUserIdSample = StringFormatter.formatSafe(request.userId, 60)

      this.loggerService.error('Input validation failed', userIdResult.error.stack, {
        failedField: 'userId',
        inputValue: safeUserIdSample,
        reason: userIdResult.error.message,
      })

      return fail(RevokeSessionApplicationError.invalidInput('userId', userIdResult.error.message))
    }

    const userId = userIdResult.value

    const sessionIdResult = Identifier.safeCreate(request.sessionId)

    if (!sessionIdResult.success) {
      const safeSessionIdSample = StringFormatter.formatSafe(request.sessionId, 60)

      this.loggerService.error('Input validation failed', sessionIdResult.error.stack, {
        failedField: 'sessionId',
        inputValue: safeSessionIdSample,
        userId: userId.value,
        reason: sessionIdResult.error.message,
      })

      return fail(RevokeSessionApplicationError.invalidInput('sessionId', sessionIdResult.error.message))
    }

    return success({
      userId: userIdResult.value,
      sessionId: sessionIdResult.value,
    })
  }
}
