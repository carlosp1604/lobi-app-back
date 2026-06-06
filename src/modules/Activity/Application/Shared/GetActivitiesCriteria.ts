import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Duration'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Location/Location'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'
import { PARTICIPATION_LIMITS } from '~/src/modules/Activity/Domain/ParticipationLimits'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivityStatus, ValidActivityStatus } from '~/src/modules/Activity/Domain/ValueObject/ActivityStatus'

export const GetActivitiesCriteriaValidSortDirection = ['asc', 'desc'] as const
export const GetActivitiesCriteriaValidSortBy = ['date', 'capacity'] as const

export type GetActivitiesCriteriaSortDirection = (typeof GetActivitiesCriteriaValidSortDirection)[number]
export type GetActivitiesCriteriaSortBy = (typeof GetActivitiesCriteriaValidSortBy)[number]

export type GetActivitiesCriteriaActiveFilters = {
  location?: Location
  radius?: IntegerNumber
  statuses?: Array<ActivityStatus>
  maxDateSeconds?: IntegerNumber
  sportId?: Identifier
  hostId?: Identifier
  participantId?: Identifier
  minDuration?: Duration
  maxDuration?: Duration
  minFreeSlots?: IntegerNumber
  levelIds?: Array<Identifier>
}

export type GetActivitiesCriteriaPagination = {
  page: IntegerNumber
  perPage: IntegerNumber
  sortBy: GetActivitiesCriteriaSortBy
  sortDirection: GetActivitiesCriteriaSortDirection
}

export type CriteriaParamError = {
  param: string
  message: string
  type: 'validation' | 'missing' | 'unsupported'
}

export type GetActivitiesCriteriaError = {
  errors: Array<CriteriaParamError>
}

export type GetActivitiesCriteriaQuery = Record<string, unknown>

export class GetActivitiesCriteria {
  private static readonly PUBLIC_SEARCH_PARAMS = [
    'location',
    'radius',
    'page',
    'perPage',
    'sortBy',
    'sortDirection',
    'maxDateSeconds',
    'statuses',
    'sportId',
    'minDuration',
    'maxDuration',
    'minFreeSlots',
    'levelIds',
  ]

  private static readonly USER_SEARCH_PARAMS = [
    'location',
    'radius',
    'page',
    'perPage',
    'sortBy',
    'sortDirection',
    'statuses',
    'sportId',
    'hostId',
    'participantId',
    'levelIds',
  ]

  private static readonly minRadius = IntegerNumber.create(100)
  private static readonly maxRadius = IntegerNumber.create(50000)
  private static readonly defaultRadius = IntegerNumber.create(10000)

  private static readonly minPage = IntegerNumber.create(1)
  private static readonly defaultPage = IntegerNumber.create(1)
  private static readonly maxPage = IntegerNumber.create(IntegerNumber.MAX_SAFE_VALUE)

  private static readonly minPerPage = IntegerNumber.create(12)
  private static readonly defaultPerPage = IntegerNumber.create(36)
  private static readonly maxPerPage = IntegerNumber.create(128)

  private static readonly defaultSortDirection: GetActivitiesCriteriaSortDirection = 'desc'
  private static readonly defaultSortBy: GetActivitiesCriteriaSortBy = 'date'

  private static readonly defaultMaxDateSeconds = IntegerNumber.create(604800)
  private static readonly minMaxDateSeconds = IntegerNumber.create(900)
  private static readonly maxMaxDateSeconds = IntegerNumber.create(604800)

  private static readonly joinableStatuses: Array<ValidActivityStatus> = [ValidActivityStatus.OPEN, ValidActivityStatus.CONFIRMED]
  private static readonly defaultJoinableStatuses: Array<ActivityStatus> = [ActivityStatus.open(), ActivityStatus.confirmed()]
  private static readonly allStatuses: Array<ValidActivityStatus> = Object.values(ValidActivityStatus)

  private static readonly minMinFreeSlots = IntegerNumber.create(1)
  private static readonly defaultMinFreeSlots = IntegerNumber.create(1)
  private static readonly maxMinFreeSlots = PARTICIPATION_LIMITS.MAX_PLAYERS.subtract(IntegerNumber.create(1))

  private constructor(
    public readonly page: IntegerNumber,
    public readonly perPage: IntegerNumber,
    public readonly sortBy: GetActivitiesCriteriaSortBy,
    public readonly sortDirection: GetActivitiesCriteriaSortDirection,
    public readonly location?: Location,
    public readonly radius?: IntegerNumber,
    public readonly statuses?: Array<ActivityStatus>,
    public readonly maxDateSeconds?: IntegerNumber,
    public readonly sportId?: Identifier,
    public readonly hostId?: Identifier,
    public readonly participantId?: Identifier,
    public readonly minDuration?: Duration,
    public readonly maxDuration?: Duration,
    public readonly minFreeSlots?: IntegerNumber,
    public readonly levelIds?: Array<Identifier>,
  ) {}

  public getActiveFilters(): GetActivitiesCriteriaActiveFilters {
    return {
      location: this.location,
      radius: this.radius,
      maxDateSeconds: this.maxDateSeconds,
      statuses: this.statuses,
      levelIds: this.levelIds,
      sportId: this.sportId,
      hostId: this.hostId,
      participantId: this.participantId,
      minFreeSlots: this.minFreeSlots,
      minDuration: this.minDuration,
      maxDuration: this.maxDuration,
    }
  }

  public getPaginationAndSort(): GetActivitiesCriteriaPagination {
    return {
      page: this.page,
      perPage: this.perPage,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection,
    }
  }

  public static fromQuery(query: GetActivitiesCriteriaQuery): Result<GetActivitiesCriteria, GetActivitiesCriteriaError> {
    const unsupportedParamsResult = this.checkForUnsupportedParams(query, this.PUBLIC_SEARCH_PARAMS)

    if (!unsupportedParamsResult.success) {
      return unsupportedParamsResult
    }

    if (!query.location) {
      return fail({ errors: [{ param: 'location', message: 'Missing param', type: 'missing' }] })
    }

    const locationResult = this.validateLocationString(query.location)

    if (!locationResult.success) {
      const error = locationResult.error

      return fail({ errors: [error] })
    }

    const location = locationResult.value
    const radius = this.validateIntegerNumber(this.defaultRadius, this.minRadius, this.maxRadius, query.radius)

    const page = this.validateIntegerNumber(this.defaultPage, this.minPage, this.maxPage, query.page)
    const perPage = this.validateIntegerNumber(this.defaultPerPage, this.minPerPage, this.maxPerPage, query.perPage)
    const sortDirection = this.validateSortDirection(query.sortDirection)
    const sortBy = this.validateSortBy(query.sortBy)

    const maxDateSeconds = this.validateIntegerNumber(
      this.defaultMaxDateSeconds,
      this.minMaxDateSeconds,
      this.maxMaxDateSeconds,
      query.maxDateSeconds,
    )
    const minFreeSlots = this.validateIntegerNumber(
      this.defaultMinFreeSlots,
      this.minMinFreeSlots,
      this.maxMinFreeSlots,
      query.minFreeSlots,
    )
    const { minDuration, maxDuration } = this.validateDuration(query.minDuration, query.maxDuration)

    const isUserSearch = false
    const statuses = this.validateStatuses(isUserSearch, query.statuses)

    const sportId = this.validateIdentifier(query.sportId)
    const levelIds = this.validateIdentifierArray(query.levelIds)

    return success(
      new GetActivitiesCriteria(
        page,
        perPage,
        sortBy,
        sortDirection,
        location,
        radius,
        statuses,
        maxDateSeconds,
        sportId,
        undefined,
        undefined,
        minDuration,
        maxDuration,
        minFreeSlots,
        levelIds,
      ),
    )
  }

  public static fromUserQuery(query: GetActivitiesCriteriaQuery): Result<GetActivitiesCriteria, GetActivitiesCriteriaError> {
    const unsupportedParamsResult = this.checkForUnsupportedParams(query, this.USER_SEARCH_PARAMS)

    if (!unsupportedParamsResult.success) {
      return unsupportedParamsResult
    }

    let location: Location | undefined = undefined
    let radius: IntegerNumber | undefined = undefined

    if (query.location !== undefined && query.location !== null) {
      const locationResult = this.validateLocationString(query.location)

      if (!locationResult.success) {
        const error = locationResult.error

        return fail({ errors: [error] })
      }

      location = locationResult.value
      radius = this.validateIntegerNumber(this.defaultRadius, this.minRadius, this.maxRadius, query.radius)
    }

    const hostId = this.validateIdentifier(query.hostId)
    const participantId = this.validateIdentifier(query.participantId)

    if (!hostId && !participantId) {
      return fail({
        errors: [
          { param: 'hostId', message: 'At least one of the following params: [hostId, participantId] is required', type: 'missing' },
          {
            param: 'participantId',
            message: 'At least one of the following params: [participantId, hostId] is required',
            type: 'missing',
          },
        ],
      })
    }

    const page = this.validateIntegerNumber(this.defaultPage, this.minPage, this.maxPage, query.page)
    const perPage = this.validateIntegerNumber(this.defaultPerPage, this.minPerPage, this.maxPerPage, query.perPage)
    const sortDirection = this.validateSortDirection(query.sortDirection)
    const sortBy = this.validateSortBy(query.sortBy)

    const isUserSearch = true
    const statuses = this.validateStatuses(isUserSearch, query.statuses)
    const sportId = this.validateIdentifier(query.sportId)
    const levelIds = this.validateIdentifierArray(query.levelIds)

    return success(
      new GetActivitiesCriteria(
        page,
        perPage,
        sortBy,
        sortDirection,
        location,
        radius,
        statuses,
        undefined,
        sportId,
        hostId,
        participantId,
        undefined,
        undefined,
        undefined,
        levelIds,
      ),
    )
  }

  private static checkForUnsupportedParams(
    query: Record<string, unknown>,
    allowedParams: Array<string>,
  ): Result<void, GetActivitiesCriteriaError> {
    const queryKeys = Object.keys(query)
    const errors: Array<CriteriaParamError> = []

    for (const key of queryKeys) {
      if (!allowedParams.includes(key)) {
        errors.push({ param: key, message: 'Param is not supported in this context', type: 'unsupported' })
      }
    }

    if (errors.length > 0) {
      return fail({ errors })
    }
    return success(undefined)
  }

  private static validateLocationString(value?: unknown): Result<Location, CriteriaParamError> {
    if (typeof value !== 'string') {
      return fail({ param: 'location', message: 'Location must be a string in "lat,lng" format', type: 'validation' })
    }

    const parts = value.split(',').map((p) => p.trim().replace('"', ''))

    if (parts.length !== 2) {
      return fail({ param: 'location', message: 'Location must be a string in "lat,lng" format', type: 'validation' })
    }

    const [lat, lng] = parts

    const locationResult = Location.safeCreate({ lat, lng })

    if (!locationResult.success) {
      return fail({ param: 'location', message: locationResult.error.message, type: 'validation' })
    }

    return success(locationResult.value)
  }

  private static validateIntegerNumber(
    defaultValue: IntegerNumber,
    minValue: IntegerNumber,
    maxValue: IntegerNumber,
    value?: unknown,
  ): IntegerNumber {
    const rawValue = this.validateNumericString(value)

    if (!rawValue) {
      return defaultValue
    }

    const integerPageResult = IntegerNumber.safeCreate(rawValue)

    if (!integerPageResult.success) {
      return defaultValue
    }

    const integerNumber = integerPageResult.value

    if (integerNumber.isGreaterThan(maxValue) || integerNumber.isLessThan(minValue)) {
      return defaultValue
    }

    return integerNumber
  }

  private static validateIntegerNumberWithoutDefault(
    minValue: IntegerNumber,
    maxValue: IntegerNumber,
    value?: unknown,
  ): IntegerNumber | undefined {
    const rawValue = this.validateNumericString(value)

    if (!rawValue) {
      return undefined
    }

    const integerPageResult = IntegerNumber.safeCreate(rawValue)

    if (!integerPageResult.success) {
      return undefined
    }

    const integerNumber = integerPageResult.value

    if (integerNumber.isGreaterThan(maxValue) || integerNumber.isLessThan(minValue)) {
      return undefined
    }

    return integerNumber
  }

  private static validateDuration(minValue?: unknown, maxValue?: unknown): { minDuration?: Duration; maxDuration?: Duration } {
    const rawMinDuration = this.validateNumericString(minValue)
    const rawMaxDuration = this.validateNumericString(maxValue)

    let minDuration: Duration | undefined = undefined
    let maxDuration: Duration | undefined = undefined

    if (rawMinDuration) {
      const minDurationResult = Duration.safeCreate({ value: rawMinDuration, unit: Duration.DEFAULT_UNIT })

      if (minDurationResult.success) {
        minDuration = minDurationResult.value
      }
    }

    if (rawMaxDuration) {
      const maxDurationResult = Duration.safeCreate({ value: String(rawMaxDuration), unit: Duration.DEFAULT_UNIT })

      if (maxDurationResult.success) {
        maxDuration = maxDurationResult.value
      }
    }

    if (minDuration && maxDuration && minDuration.isGreaterThan(maxDuration)) {
      return { minDuration: undefined, maxDuration: maxDuration }
    }

    return { minDuration, maxDuration }
  }

  private static validateSortDirection(value?: unknown): GetActivitiesCriteriaSortDirection {
    const defaultValue = this.defaultSortDirection

    if (value === null || value === undefined || typeof value !== 'string') {
      return defaultValue
    }

    if (GetActivitiesCriteriaValidSortDirection.includes(value as GetActivitiesCriteriaSortDirection)) {
      return value as GetActivitiesCriteriaSortDirection
    }

    return defaultValue
  }

  private static validateSortBy(value?: unknown): GetActivitiesCriteriaSortBy {
    const defaultValue = this.defaultSortBy

    if (value === null || value === undefined || typeof value !== 'string') {
      return defaultValue
    }

    if (GetActivitiesCriteriaValidSortBy.includes(value as GetActivitiesCriteriaSortBy)) {
      return value as GetActivitiesCriteriaSortBy
    }

    return defaultValue
  }

  private static validateStatuses(hasStrongFilter: boolean, value?: unknown): Array<ActivityStatus> | undefined {
    const allowedStatuses = hasStrongFilter ? this.allStatuses : this.joinableStatuses

    const rawValue: Array<string> | undefined = this.validateStringArray(value)

    if (!rawValue) {
      return hasStrongFilter ? undefined : this.defaultJoinableStatuses
    }

    const validStatuses = rawValue
      .map((status) => String(status).trim().toLowerCase())
      .filter((status) => allowedStatuses.includes(status as ValidActivityStatus))
      .map((status) => ActivityStatus.fromString(status))

    if (validStatuses.length === 0) {
      return hasStrongFilter ? undefined : this.defaultJoinableStatuses
    }

    return validStatuses
  }

  private static validateIdentifier(value?: unknown): Identifier | undefined {
    if (value === null || value === undefined || typeof value !== 'string') {
      return undefined
    }

    const identifierResult = Identifier.safeCreate(value)

    if (!identifierResult.success) {
      return undefined
    }

    return identifierResult.value
  }

  private static validateIdentifierArray(value?: unknown): Array<Identifier> | undefined {
    const rawValue: Array<string> | undefined = this.validateStringArray(value)

    if (!rawValue) {
      return undefined
    }

    return rawValue.map((identifier) => this.validateIdentifier(identifier)).filter((identifier) => identifier !== undefined)
  }

  private static validateNumericString(value?: unknown): string | undefined {
    if (value === null || value === undefined) {
      return undefined
    }

    if (typeof value !== 'string' && typeof value !== 'number') {
      return undefined
    }

    return String(value)
  }

  private static validateStringArray(value?: unknown): Array<string> | undefined {
    if (value === null || value === undefined) {
      return undefined
    }

    if (typeof value === 'string') {
      return value.split(',')
    } else if (Array.isArray(value)) {
      const validItems = value.filter((item) => typeof item === 'string')

      return validItems.length > 0 ? validItems : undefined
    }

    return undefined
  }
}
