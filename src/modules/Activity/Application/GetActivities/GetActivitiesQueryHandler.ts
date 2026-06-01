import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { GetActivitiesQuery } from '~/src/modules/Activity/Application/GetActivities/GetActivitiesQuery'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { GetActivitiesCriteria } from '~/src/modules/Activity/Application/Shared/GetActivitiesCriteria'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivitiesFinderInterface } from '~/src/modules/Activity/Application/Shared/ActivitiesFinderInterface'
import { GetActivitiesQueryResponseDto } from '~/src/modules/Activity/Application/Shared/GetActivitiesQueryResponseDto'
import { GetActivitiesQueryResponseDtoTranslator } from '~/src/modules/Activity/Application/Shared/GetActivitiesQueryResponseDtoTranslator'
import {
  GetActivitiesQueryError,
  GetActivitiesQueryInputError,
} from '~/src/modules/Activity/Application/GetActivities/GetActivitiesQueryError'

type ValidatedQuery = {
  userId: Identifier | null
  criteria: GetActivitiesCriteria
}

export class GetActivitiesQueryHandler {
  constructor(
    private readonly activitiesFinder: ActivitiesFinderInterface,
    private readonly clockService: ClockServiceInterface,
  ) {}

  public async execute(query: GetActivitiesQuery): Promise<Result<GetActivitiesQueryResponseDto, GetActivitiesQueryError>> {
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

  private validateQueryData(query: GetActivitiesQuery): Result<ValidatedQuery, GetActivitiesQueryError> {
    let userId: Identifier | null = null

    if (query.userId) {
      const userIdResult = Identifier.safeCreate(query.userId)

      if (!userIdResult.success) {
        return fail(GetActivitiesQueryError.invalidUserId(userIdResult.error.message))
      }

      userId = userIdResult.value
    }

    const criteriaResult = GetActivitiesCriteria.fromQuery(query.params)

    if (!criteriaResult.success) {
      const inputErrors = criteriaResult.error.errors.map((error) => {
        switch (error.type) {
          case 'missing':
            return GetActivitiesQueryInputError.missingError(error.param, error.message)
          case 'unsupported':
            return GetActivitiesQueryInputError.unsupportedError(error.param, error.message)
          case 'validation':
          default:
            return GetActivitiesQueryInputError.validationError(error.param, error.message)
        }
      })

      return fail(GetActivitiesQueryError.invalidParams(inputErrors))
    }

    const criteria = criteriaResult.value

    return success({ userId, criteria })
  }
}
