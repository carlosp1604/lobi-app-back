import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { GetActivitiesCriteria } from '~/src/modules/Activity/Application/Shared/GetActivitiesCriteria'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { GetUserActivitiesQuery } from '~/src/modules/Activity/Application/GetUserActivities/GetUserActivitiesQuery'
import { ActivitiesFinderInterface } from '~/src/modules/Activity/Application/Shared/ActivitiesFinderInterface'
import { GetActivitiesQueryResponseDto } from '~/src/modules/Activity/Application/Shared/GetActivitiesQueryResponseDto'
import { GetActivitiesQueryResponseDtoTranslator } from '~/src/modules/Activity/Application/Shared/GetActivitiesQueryResponseDtoTranslator'
import {
  GetUserActivitiesQueryError,
  GetUserActivitiesQueryInputError,
} from '~/src/modules/Activity/Application/GetUserActivities/GetUserActivitiesQueryError'

type ValidatedQuery = {
  userId: Identifier | null
  criteria: GetActivitiesCriteria
}

export class GetUserActivitiesQueryHandler {
  constructor(
    private readonly activitiesFinder: ActivitiesFinderInterface,
    private readonly clockService: ClockServiceInterface,
  ) {}

  public async execute(query: GetUserActivitiesQuery): Promise<Result<GetActivitiesQueryResponseDto, GetUserActivitiesQueryError>> {
    const validatedQueryResult = this.validateQueryData(query)

    if (!validatedQueryResult.success) {
      return validatedQueryResult
    }

    const { userId, criteria } = validatedQueryResult.value

    const now = this.clockService.now()

    const data = await this.activitiesFinder.find(criteria, userId, now)

    return success(
      new GetActivitiesQueryResponseDtoTranslator().translate({
        userId,
        criteria,
        activityList: data,
      }),
    )
  }

  private validateQueryData(query: GetUserActivitiesQuery): Result<ValidatedQuery, GetUserActivitiesQueryError> {
    let userId: Identifier | null = null

    if (query.userId) {
      const userIdResult = Identifier.safeCreate(query.userId)

      if (!userIdResult.success) {
        return fail(GetUserActivitiesQueryError.invalidUserId(userIdResult.error.message))
      }

      userId = userIdResult.value
    }

    const criteriaResult = GetActivitiesCriteria.fromUserQuery(query.params)

    if (!criteriaResult.success) {
      const inputErrors = criteriaResult.error.errors.map((err) => {
        switch (err.type) {
          case 'missing':
            return GetUserActivitiesQueryInputError.missingError(err.param, err.message)
          case 'unsupported':
            return GetUserActivitiesQueryInputError.unsupportedError(err.param, err.message)
          case 'validation':
          default:
            return GetUserActivitiesQueryInputError.validationError(err.param, err.message)
        }
      })

      return fail(GetUserActivitiesQueryError.invalidParams(inputErrors))
    }

    const criteria = criteriaResult.value

    return success({ userId, criteria })
  }
}
