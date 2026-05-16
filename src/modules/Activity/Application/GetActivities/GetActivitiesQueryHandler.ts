import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { expectAllKeys } from '~/src/modules/Shared/Application/ValidationHelpers'
import { GetActivitiesQuery } from '~/src/modules/Activity/Application/GetActivities/GetActivitiesQuery'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivitiesFinderInterface } from '~/src/modules/Activity/Application/GetActivities/ActivitiesFinderInterface'
import { GetActivitiesQueryResponseDto } from '~/src/modules/Activity/Application/GetActivities/GetActivitiesQueryResponseDto'
import { GetActivitiesQueryResponseDtoTranslator } from '~/src/modules/Activity/Application/GetActivities/GetActivitiesQueryResponseDtoTranslator'
import {
  GetActivitiesCriteria,
  GetActivitiesCriteriaQuery,
} from '~/src/modules/Activity/Application/GetActivities/GetActivitiesCriteria'
import {
  GetActivitiesQueryError,
  GetActivitiesQueryInputError,
} from '~/src/modules/Activity/Application/GetActivities/GetActivitiesQueryError'

export const SUPPORTED_PARAMS = expectAllKeys<GetActivitiesCriteriaQuery>()(
  'lat',
  'lng',
  'radius',
  'page',
  'perPage',
  'sortBy',
  'sortDirection',
  'maxDateSeconds',
  'statuses',
  'sportId',
  'hostId',
  'participantId',
  'minDuration',
  'maxDuration',
  'minFreeSlots',
  'levelIds',
)

type ValidatedQuery = {
  userId: Identifier | null
  criteria: GetActivitiesCriteria
}

export class GetActivitiesQueryHandler {
  constructor(private readonly activitiesFinder: ActivitiesFinderInterface) {}

  public async execute(query: GetActivitiesQuery): Promise<Result<GetActivitiesQueryResponseDto, GetActivitiesQueryError>> {
    const validatedQueryResult = this.validateQueryData(query)

    if (!validatedQueryResult.success) {
      return validatedQueryResult
    }

    const { userId, criteria } = validatedQueryResult.value

    const data = await this.activitiesFinder.find(criteria, userId)

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

    const validatedQueryResult = this.parseAndValidate(query.params)

    if (!validatedQueryResult.success) {
      return validatedQueryResult
    }

    const validatedQuery = validatedQueryResult.value

    const criteriaResult = GetActivitiesCriteria.fromQuery(validatedQuery)

    if (!criteriaResult.success) {
      const groupedErrors = new Map<string, string[]>()

      criteriaResult.error.errors.forEach((err) => {
        const existing = groupedErrors.get(err.param) ?? []
        groupedErrors.set(err.param, [...existing, err.message])
      })

      const inputErrors = Array.from(groupedErrors.entries()).map(([field, messages]) =>
        GetActivitiesQueryInputError.validationError(field, messages.length === 1 ? messages[0] : messages),
      )

      return fail(GetActivitiesQueryError.invalidParams(inputErrors))
    }

    const criteria = criteriaResult.value

    return success({ userId, criteria })
  }

  private parseAndValidate(query: Record<string, unknown>): Result<GetActivitiesCriteriaQuery, GetActivitiesQueryError> {
    const errors: Array<GetActivitiesQueryInputError> = []

    const unsupported = this.checkForUnsupportedParams(query)
    if (unsupported.length > 0) {
      return fail(GetActivitiesQueryError.invalidParams(unsupported))
    }

    const lat = this.extractNumber(query.lat)
    const lng = this.extractNumber(query.lng)

    if (!lat) {
      errors.push(GetActivitiesQueryInputError.missingError('lat'))
    }

    if (!lng) {
      errors.push(GetActivitiesQueryInputError.missingError('lng'))
    }

    if (errors.length > 0) {
      return fail(GetActivitiesQueryError.invalidParams(errors))
    }

    return success({
      lat: lat!,
      lng: lng!,
      radius: this.extractNumber(query.radius),
      page: this.extractNumber(query.page),
      perPage: this.extractNumber(query.perPage),
      sortBy: typeof query.sortBy === 'string' ? query.sortBy : undefined,
      sortDirection: typeof query.sortDirection === 'string' ? query.sortDirection : undefined,
      maxDateSeconds: this.extractNumber(query.maxDateSeconds),
      statuses: this.extractStringArray(query.statuses),
      sportId: typeof query.sportId === 'string' ? query.sportId : undefined,
      hostId: typeof query.hostId === 'string' ? query.hostId : undefined,
      participantId: typeof query.participantId === 'string' ? query.participantId : undefined,
      minFreeSlots: this.extractNumber(query.minFreeSlots),
      levelIds: this.extractStringArray(query.levelIds),
      maxDuration: this.extractNumber(query.maxDuration),
      minDuration: this.extractNumber(query.minDuration),
    })
  }

  private extractNumber(value: unknown): string | undefined {
    if (typeof value === 'number') {
      return String(value)
    }

    if (typeof value === 'string') {
      return value
    }

    return undefined
  }

  private extractStringArray(value: unknown): Array<string> | undefined {
    if (typeof value === 'string') {
      return value.split(',')
    }

    if (Array.isArray(value)) {
      const validItems = value.filter((item) => typeof item === 'string')
      return validItems.length > 0 ? validItems : undefined
    }

    return undefined
  }

  private checkForUnsupportedParams(query: Record<string, unknown>): Array<GetActivitiesQueryInputError> {
    const queryKeys = Object.keys(query)
    const unsupportedErrors: Array<GetActivitiesQueryInputError> = []

    for (const key of queryKeys) {
      if (!SUPPORTED_PARAMS.includes(key as (typeof SUPPORTED_PARAMS)[number])) {
        unsupportedErrors.push(GetActivitiesQueryInputError.unsupportedError(key))
      }
    }

    return unsupportedErrors
  }
}
