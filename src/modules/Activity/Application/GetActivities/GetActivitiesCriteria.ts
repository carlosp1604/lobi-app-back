import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Duration'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Location/Location'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'
import { PARTICIPATION_LIMITS } from '~/src/modules/Activity/Domain/ParticipationLimits'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivityStatus, ValidActivityStatus } from '~/src/modules/Activity/Domain/ValueObject/ActivityStatus'

export const GetActivitiesCriteriaValidSortDirection = ['asc', 'desc'] as const
export const GetActivitiesCriteriaValidSortBy = ['date', 'capacity', 'level'] as const

export type GetActivitiesCriteriaSortDirection = (typeof GetActivitiesCriteriaValidSortDirection)[number]
export type GetActivitiesCriteriaSortBy = (typeof GetActivitiesCriteriaValidSortBy)[number]

export type GetActivitiesCriteriaQuery = {
  lat: string
  lng: string
  radius?: string
  page?: string
  perPage?: string
  sortBy?: string
  sortDirection?: string
  maxDateSeconds?: string
  statuses?: Array<string>
  sportId?: string
  hostId?: string
  participantId?: string
  minDuration?: string
  maxDuration?: string
  minFreeSlots?: string
  levelIds?: Array<string>
}

export type GetActivitiesCriteriaActiveFilters = {
  location: Location
  radius: IntegerNumber
  statuses: Array<ActivityStatus>
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
}

export type GetActivitiesCriteriaError = {
  errors: Array<CriteriaParamError>
}

export class GetActivitiesCriteria {
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

  private static readonly minMaxDateSeconds = IntegerNumber.create(900)
  private static readonly maxMaxDateSeconds = IntegerNumber.create(604800)

  private static readonly defaultStatuses: Array<ActivityStatus> = [ActivityStatus.open(), ActivityStatus.confirmed()]

  private static readonly minMinFreeSlots = IntegerNumber.create(1)
  private static readonly defaultMinFreeSlots = IntegerNumber.create(1)
  private static readonly maxMinFreeSlots = PARTICIPATION_LIMITS.MAX_PLAYERS.subtract(IntegerNumber.create(1))

  private constructor(
    public readonly location: Location,
    public readonly radius: IntegerNumber,
    public readonly page: IntegerNumber,
    public readonly perPage: IntegerNumber,
    public readonly sortBy: GetActivitiesCriteriaSortBy,
    public readonly sortDirection: GetActivitiesCriteriaSortDirection,
    public readonly statuses: Array<ActivityStatus>,
    public readonly maxDateSeconds?: IntegerNumber,
    public readonly sportId?: Identifier,
    public readonly hostId?: Identifier,
    public readonly participantId?: Identifier,
    public readonly minDuration?: Duration,
    public readonly maxDuration?: Duration,
    public readonly minFreeSlots?: IntegerNumber,
    public readonly levelIds?: Array<Identifier>,
  ) {}

  public get offset(): number {
    return (this.page.value - 1) * this.perPage.value
  }

  public get limit(): number {
    return this.perPage.value
  }

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
    const locationResult = Location.safeCreate({ lat: query.lat, lng: query.lng })

    if (!locationResult.success) {
      return fail({
        errors: [
          { param: 'lat', message: locationResult.error.message },
          { param: 'lng', message: locationResult.error.message },
        ],
      })
    }

    const location = locationResult.value

    const radius = this.validateIntegerNumber(this.defaultRadius, this.minRadius, this.maxRadius, query.radius)

    const page = this.validateIntegerNumber(this.defaultPage, this.minPage, this.maxPage, query.page)
    const perPage = this.validateIntegerNumber(this.defaultPerPage, this.minPerPage, this.maxPerPage, query.perPage)

    const sortDirection = this.validateSortDirection(query.sortDirection)
    const sortBy = this.validateSortBy(query.sortBy)

    const maxDateSeconds = this.validateIntegerNumberWithoutDefault(
      this.minMaxDateSeconds,
      this.maxMaxDateSeconds,
      query.maxDateSeconds,
    )

    const statuses = this.validateStatuses(query.statuses)

    const sportId = this.validateIdentifier(query.sportId)
    const hostId = this.validateIdentifier(query.hostId)
    const participantId = this.validateIdentifier(query.participantId)

    const { minDuration, maxDuration } = this.validateDuration(query.minDuration, query.maxDuration)

    const minFreeSlots = this.validateIntegerNumber(
      this.defaultMinFreeSlots,
      this.minMinFreeSlots,
      this.maxMinFreeSlots,
      query.minFreeSlots,
    )

    const levelIds = this.validateIdentifierArray(query.levelIds)

    return success(
      new GetActivitiesCriteria(
        location,
        radius,
        page,
        perPage,
        sortBy,
        sortDirection,
        statuses,
        maxDateSeconds,
        sportId,
        hostId,
        participantId,
        minDuration,
        maxDuration,
        minFreeSlots,
        levelIds,
      ),
    )
  }

  private static validateIntegerNumber(
    defaultValue: IntegerNumber,
    minValue: IntegerNumber,
    maxValue: IntegerNumber,
    value?: string,
  ): IntegerNumber {
    if (value === null || value === undefined) {
      return defaultValue
    }

    const integerPageResult = IntegerNumber.safeCreate(value)

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
    value?: string,
  ): IntegerNumber | undefined {
    if (value === null || value === undefined) {
      return undefined
    }

    const integerPageResult = IntegerNumber.safeCreate(value)

    if (!integerPageResult.success) {
      return undefined
    }

    const integerNumber = integerPageResult.value

    if (integerNumber.isGreaterThan(maxValue) || integerNumber.isLessThan(minValue)) {
      return undefined
    }

    return integerNumber
  }

  private static validateDuration(minValue?: string, maxValue?: string): { minDuration?: Duration; maxDuration?: Duration } {
    let minDuration: Duration | undefined = undefined
    let maxDuration: Duration | undefined = undefined

    if (minValue !== undefined && minValue !== null) {
      const minDurationResult = Duration.safeCreate({ value: minValue, unit: Duration.DEFAULT_UNIT })

      if (minDurationResult.success) {
        minDuration = minDurationResult.value
      }
    }

    if (maxValue !== undefined && maxValue !== null) {
      const maxDurationResult = Duration.safeCreate({ value: maxValue, unit: Duration.DEFAULT_UNIT })

      if (maxDurationResult.success) {
        maxDuration = maxDurationResult.value
      }
    }

    if (minDuration && maxDuration && minDuration.isGreaterThan(maxDuration)) {
      return { minDuration: undefined, maxDuration: maxDuration }
    }

    return { minDuration, maxDuration }
  }

  private static validateSortDirection(value?: string): GetActivitiesCriteriaSortDirection {
    const defaultValue = this.defaultSortDirection

    if (value === null || value === undefined) {
      return defaultValue
    }

    if (GetActivitiesCriteriaValidSortDirection.includes(value as GetActivitiesCriteriaSortDirection)) {
      return value as GetActivitiesCriteriaSortDirection
    }

    return defaultValue
  }

  private static validateSortBy(value?: string): GetActivitiesCriteriaSortBy {
    const defaultValue = this.defaultSortBy

    if (value === null || value === undefined) {
      return defaultValue
    }

    if (GetActivitiesCriteriaValidSortBy.includes(value as GetActivitiesCriteriaSortBy)) {
      return value as GetActivitiesCriteriaSortBy
    }

    return defaultValue
  }

  private static validateStatuses(value?: Array<string>): Array<ActivityStatus> {
    const defaultValue = this.defaultStatuses

    if (value === undefined || value === null || !Array.isArray(value)) {
      return defaultValue
    }

    return value
      .filter((status) => Object.values(ValidActivityStatus).includes(status as ValidActivityStatus))
      .map((status) => ActivityStatus.fromString(status))
  }

  private static validateIdentifier(value?: string): Identifier | undefined {
    if (value === null || value === undefined) {
      return undefined
    }

    const identifierResult = Identifier.safeCreate(value)

    if (!identifierResult.success) {
      return undefined
    }

    return identifierResult.value
  }

  private static validateIdentifierArray(value?: Array<string>): Array<Identifier> {
    const defaultValue: Array<Identifier> = []

    if (value === null || value === undefined || !Array.isArray(value)) {
      return defaultValue
    }

    return value.map((identifier) => this.validateIdentifier(identifier)).filter((identifier) => identifier !== undefined)
  }
}
