import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { GetActiveSessionsApplicationError } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationError'
import { GetActiveSessionsApplicationRequestDto } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationRequestDto'
import { GetActiveSessionsApplicationResponseDto } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationResponseDto'
import { GetActiveSessionsUserSessionApplicationDtoTranslator } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsUserSessionApplicationDtoTranslator'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'

export class GetActiveSessions {
  constructor(
    private readonly sessionRepository: UserSessionRepositoryInterface,
    private readonly clockService: ClockServiceInterface,
    private readonly loggerService: LoggerServiceInterface,
  ) {}

  async execute(
    request: GetActiveSessionsApplicationRequestDto,
  ): Promise<Result<GetActiveSessionsApplicationResponseDto, GetActiveSessionsApplicationError>> {
    const validateInputResult = this.validateInput(request)

    if (!validateInputResult.success) {
      return validateInputResult
    }

    const { userId, currentSessionId } = validateInputResult.value

    const now = this.clockService.now()

    const activeSessions = await this.sessionRepository.findUserActiveSessions(userId, now)

    const sessionsDto = activeSessions.map((activeSession) =>
      GetActiveSessionsUserSessionApplicationDtoTranslator.fromDomain(activeSession, currentSessionId),
    )

    return success({ sessions: sessionsDto })
  }

  private validateInput(
    request: GetActiveSessionsApplicationRequestDto,
  ): Result<{ userId: Identifier; currentSessionId: Identifier }, GetActiveSessionsApplicationError> {
    const userIdResult = Identifier.safeCreate(request.userId)

    if (!userIdResult.success) {
      const safeUserIdSample = StringFormatter.formatSafe(request.userId, 60)

      this.loggerService.error('Input validation failed', userIdResult.error.stack, {
        failedField: 'userId',
        inputValue: safeUserIdSample,
        reason: userIdResult.error.message,
      })

      return fail(GetActiveSessionsApplicationError.invalidInput('userId', userIdResult.error.message))
    }

    const userId = userIdResult.value

    const sessionIdResult = Identifier.safeCreate(request.currentSessionId)

    if (!sessionIdResult.success) {
      const safeSessionIdSample = StringFormatter.formatSafe(request.currentSessionId, 60)

      this.loggerService.error('Input validation failed', sessionIdResult.error.stack, {
        failedField: 'currentSessionId',
        inputValue: safeSessionIdSample,
        userId: userId.value,
        reason: sessionIdResult.error.message,
      })

      return fail(GetActiveSessionsApplicationError.invalidInput('currentSessionId', sessionIdResult.error.message))
    }

    return success({
      userId: userIdResult.value,
      currentSessionId: sessionIdResult.value,
    })
  }
}
