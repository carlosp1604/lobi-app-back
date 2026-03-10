import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { GetActiveSessionsApplicationError } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationError'
import { GetActiveSessionsApplicationRequestDto } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationRequestDto'
import { GetActiveSessionsApplicationResponseDto } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationResponseDto'
import { GetActiveSessionsUserSessionApplicationDtoTranslator } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsUserSessionApplicationDtoTranslator'

export class GetActiveSessions {
  constructor(
    private readonly sessionRepository: UserSessionRepositoryInterface,
    private readonly clockService: ClockServiceInterface,
  ) {}

  async execute(request: GetActiveSessionsApplicationRequestDto): Promise<Result<GetActiveSessionsApplicationResponseDto, Error>> {
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
    const sessionIdResult = Identifier.safeCreate(request.currentSessionId)

    if (!userIdResult.success || !sessionIdResult.success) {
      return fail(GetActiveSessionsApplicationError.invalidInput())
    }

    return success({
      userId: userIdResult.value,
      currentSessionId: sessionIdResult.value,
    })
  }
}
