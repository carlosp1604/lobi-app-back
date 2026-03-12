import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'
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

      if (!user) {
        this.loggerService.warn('Inconsistent state', {
          userId: userId.value,
          reason: 'User not found',
        })

        return fail(LogoutUserApplicationError.userNotFound(userId.value))
      }

      if (!user.isActive()) {
        this.loggerService.warn('Inconsistent state', {
          userId: userId.value,
          reason: 'User is disabled',
        })

        return fail(LogoutUserApplicationError.userDisabled(userId.value))
      }

      const session = await this.sessionRepository.findById(sessionId, context)

      if (!session) {
        this.loggerService.warn('Logout user failed', {
          userId: userId.value,
          sessionId: sessionId.value,
          reason: 'Session not found',
        })

        return fail(LogoutUserApplicationError.sessionNotFound(sessionId.value))
      }

      if (!session.userId.equals(user.id)) {
        this.loggerService.warn('Logout user rejected', {
          requestedUserId: userId.value,
          actualSessionOwner: session.userId.value,
          sessionId: sessionId.value,
          reason: 'Session owner mismatch',
        })

        return fail(LogoutUserApplicationError.sessionDoesNotBelongToUser(sessionId.value, userId.value))
      }

      const canRevokeResult = session.canBeRevoked(now)

      if (!canRevokeResult.success) {
        this.loggerService.warn('Logout user rejected', {
          userId: userId.value,
          sessionId: sessionId.value,
          reason: canRevokeResult.error.message,
        })

        return fail(LogoutUserApplicationError.cannotRevokeSession(canRevokeResult.error.message))
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

    if (!userIdResult.success) {
      const safeUserIdSample = StringFormatter.formatSafe(request.userId, 60)

      this.loggerService.error('Input validation failed', userIdResult.error.stack, {
        failedField: 'userId',
        inputValue: safeUserIdSample,
        reason: userIdResult.error.message,
      })

      return fail(LogoutUserApplicationError.invalidInput('userId', userIdResult.error.message))
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

      return fail(LogoutUserApplicationError.invalidInput('sessionId', sessionIdResult.error.message))
    }

    return success({
      userId: userIdResult.value,
      sessionId: sessionIdResult.value,
    })
  }
}
