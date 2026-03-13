import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { CloseUserSessionApplicationError } from '~/src/modules/Auth/Application/CloseUserSession/CloseUserSessionApplicationError'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { CloseUserSessionApplicationRequestDto } from '~/src/modules/Auth/Application/CloseUserSession/CloseUserSessionApplicationRequestDto'

interface CloseUserSessionValidatedInput {
  userId: Identifier
  sessionId: Identifier
  currentSessionId: Identifier
}

export class CloseUserSession {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly sessionRepository: UserSessionRepositoryInterface,
    private readonly domainEventRepository: DomainEventRepositoryInterface,
    private readonly requestOriginApplicationService: RequestOriginApplicationService,
    private readonly clockService: ClockServiceInterface,
    private readonly unitOfWork: UnitOfWork,
    private readonly loggerService: LoggerServiceInterface,
    private readonly authDomainEventFactory: AuthDomainEventFactory,
  ) {}

  public async execute(request: CloseUserSessionApplicationRequestDto): Promise<Result<void, CloseUserSessionApplicationError>> {
    const now = this.clockService.now()

    const inputValidationResult = this.validateInput(request)

    if (!inputValidationResult.success) {
      return inputValidationResult
    }

    const { userId, sessionId, currentSessionId } = inputValidationResult.value

    const { userAgent, ipHash, deviceLocation } = await this.requestOriginApplicationService.process(request.ip, request.userAgent, {
      userId: userId.value,
      targetSessionId: sessionId.value,
      currentSessionId: currentSessionId.value,
    })

    return this.unitOfWork.runInTransaction(async (context) => {
      const user = await this.userRepository.findByIdWithLock(userId.value, context)

      if (!user) {
        this.loggerService.warn('Inconsistent state', {
          userId: userId.value,
          reason: 'User not found',
        })

        return fail(CloseUserSessionApplicationError.userNotFound(userId.value))
      }

      if (!user.isActive()) {
        this.loggerService.warn('Inconsistent state', {
          userId: userId.value,
          reason: 'User is disabled',
        })

        return fail(CloseUserSessionApplicationError.userDisabled(userId.value))
      }

      const session = await this.sessionRepository.findById(sessionId, context)

      if (!session) {
        this.loggerService.warn('Session closure failed', {
          userId: userId.value,
          sessionId: sessionId.value,
          reason: 'Session not found',
        })

        return fail(CloseUserSessionApplicationError.sessionNotFound(sessionId.value))
      }

      if (!session.userId.equals(user.id)) {
        this.loggerService.warn('Session closure rejected', {
          requestedUserId: userId.value,
          actualSessionOwner: session.userId.value,
          sessionId: sessionId.value,
          reason: 'Session owner mismatch',
        })

        return fail(CloseUserSessionApplicationError.sessionDoesNotBelongToUser(sessionId.value, userId.value))
      }

      const canRevokeResult = session.canBeRevoked(now)

      if (!canRevokeResult.success) {
        this.loggerService.warn('Session closure rejected', {
          userId: userId.value,
          sessionId: sessionId.value,
          reason: canRevokeResult.error.message,
        })

        return fail(CloseUserSessionApplicationError.cannotRevokeSession(canRevokeResult.error.message))
      }

      session.revoke(now)

      const remoteSessionClosedEvent = this.authDomainEventFactory.createClosedSessionEvent(
        session,
        currentSessionId,
        deviceLocation,
        userAgent,
        ipHash,
        now,
      )

      await this.sessionRepository.save([session], context)
      await this.domainEventRepository.save(remoteSessionClosedEvent, context)

      return success(undefined)
    })
  }

  private validateInput(
    request: CloseUserSessionApplicationRequestDto,
  ): Result<CloseUserSessionValidatedInput, CloseUserSessionApplicationError> {
    const userIdResult = Identifier.safeCreate(request.userId)

    if (!userIdResult.success) {
      const safeUserIdSample = StringFormatter.formatSafe(request.userId, 60)

      this.loggerService.error('Input validation failed', userIdResult.error.stack, {
        failedField: 'userId',
        inputValue: safeUserIdSample,
        reason: userIdResult.error.message,
      })

      return fail(CloseUserSessionApplicationError.invalidInput('userId', userIdResult.error.message))
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

      return fail(CloseUserSessionApplicationError.invalidInput('sessionId', sessionIdResult.error.message))
    }

    const currentSessionIdResult = Identifier.safeCreate(request.currentSessionId)

    if (!currentSessionIdResult.success) {
      const safeCurrentSessionIdSample = StringFormatter.formatSafe(request.currentSessionId, 60)

      this.loggerService.error('Input validation failed', currentSessionIdResult.error.stack, {
        failedField: 'currentSessionId',
        inputValue: safeCurrentSessionIdSample,
        userId: userId.value,
        reason: currentSessionIdResult.error.message,
      })

      return fail(CloseUserSessionApplicationError.invalidInput('currentSessionId', currentSessionIdResult.error.message))
    }

    return success({
      userId: userIdResult.value,
      sessionId: sessionIdResult.value,
      currentSessionId: currentSessionIdResult.value,
    })
  }
}
