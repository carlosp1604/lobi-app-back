import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { GetUserSecurityDetailsQueryError } from '~/src/modules/Auth/Application/GetUserSecurityDetails/GetUserSecurityDetailsQueryError'
import { GetUserSecurityDetailsQuery } from '~/src/modules/Auth/Application/GetUserSecurityDetails/GetUserSecurityDetailsQuery'
import { GetUserSecurityDetailsQueryResponseDtoTranslator } from '~/src/modules/Auth/Application/GetUserSecurityDetails/GetUserSecurityDetailsQueryResponseDtoTranslator'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserSecurityFinderInterface } from '~/src/modules/Auth/Application/GetUserSecurityDetails/UserSecurityFinderInterface'
import { GetUserSecurityDetailsQueryResponseDto } from '~/src/modules/Auth/Application/GetUserSecurityDetails/GetUserSecurityDetailsQueryResponseDto'

type ValidatedQuery = {
  userId: Identifier
  currentSessionId: Identifier
}

export class GetUserSecurityDetailsQueryHandler {
  constructor(
    private readonly userSecurityFinder: UserSecurityFinderInterface,
    private readonly clockService: ClockServiceInterface,
    private readonly loggerService: LoggerServiceInterface,
  ) {}

  async execute(
    query: GetUserSecurityDetailsQuery,
  ): Promise<Result<GetUserSecurityDetailsQueryResponseDto, GetUserSecurityDetailsQueryError>> {
    const validateInputResult = this.validateQuery(query)

    if (!validateInputResult.success) {
      return validateInputResult
    }

    const { userId, currentSessionId } = validateInputResult.value

    const now = this.clockService.now()

    const data = await this.userSecurityFinder.findDetails(userId, now)

    if (!data) {
      return fail(GetUserSecurityDetailsQueryError.userNotFound())
    }

    const responseDto = new GetUserSecurityDetailsQueryResponseDtoTranslator().translate({ readModel: data, currentSessionId, now })

    return success(responseDto)
  }

  private validateQuery(query: GetUserSecurityDetailsQuery): Result<ValidatedQuery, GetUserSecurityDetailsQueryError> {
    const userIdResult = Identifier.safeCreate(query.userId)

    if (!userIdResult.success) {
      return fail(GetUserSecurityDetailsQueryError.invalidUserId(userIdResult.error.message))
    }

    const userId = userIdResult.value

    const sessionIdResult = Identifier.safeCreate(query.currentSessionId)

    if (!sessionIdResult.success) {
      return fail(GetUserSecurityDetailsQueryError.invalidSessionId(sessionIdResult.error.message))
    }

    const currentSessionId = sessionIdResult.value

    return success({ userId, currentSessionId })
  }
}
