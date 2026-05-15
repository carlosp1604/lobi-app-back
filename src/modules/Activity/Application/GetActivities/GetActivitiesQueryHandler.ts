import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { EntityManager } from 'typeorm'
import { expectAllKeys } from '~/src/modules/Shared/Application/ValidationHelpers'
import { GetActivitiesQuery } from '~/src/modules/Activity/Application/GetActivities/GetActivitiesQuery'
import { SportLevelReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportLevelReadModel'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { BasicSportRankingSystem } from '~/src/modules/Activity/Domain/Sport/Ranking/BasicSportRankingSystem'
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
import {
  ActivityListReadModel,
  ActivityListItemReadModelWithoutLevels,
  ActivityListItemReadModel,
} from '~/src/modules/Activity/Application/ReadModel/ActivityListReadModel'

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
  constructor(private readonly entityManager: EntityManager) {}

  public async execute(query: GetActivitiesQuery): Promise<Result<GetActivitiesQueryResponseDto, GetActivitiesQueryError>> {
    const validatedQueryResult = this.validateQueryData(query)

    if (!validatedQueryResult.success) {
      return validatedQueryResult
    }

    const { userId, criteria } = validatedQueryResult.value

    const data = await this.runQuery(criteria, userId)

    return success(
      new GetActivitiesQueryResponseDtoTranslator().translate({
        userId,
        criteria,
        activityList: data,
      }),
    )
  }

  private async runQuery(criteria: GetActivitiesCriteria, userId: Identifier | null): Promise<ActivityListReadModel> {
    const values: any[] = []

    values.push(userId?.value ?? null)

    const whereClauses: string[] = []

    values.push(criteria.location.value.lng.stringValue, criteria.location.value.lat.stringValue, criteria.radius.value)
    whereClauses.push(
      `ST_DWithin(a.location::geography, ST_SetSRID(ST_MakePoint($${values.length - 2}, $${values.length - 1}), 4326)::geography, $${values.length})`,
    )

    if (criteria.maxDateSeconds) {
      values.push(criteria.maxDateSeconds.value)
      const secondsParamIndex = values.length

      whereClauses.push('a.scheduled_at >= NOW()')

      whereClauses.push(`a.scheduled_at <= NOW() + ($${secondsParamIndex} * INTERVAL '1 second')`)
    }

    values.push(criteria.statuses.map((s) => s.value))
    whereClauses.push(`a.status = ANY($${values.length})`)

    if (criteria.sportId) {
      values.push(criteria.sportId.value)
      whereClauses.push(`a.sport_id = $${values.length}`)
    }

    if (criteria.hostId) {
      values.push(criteria.hostId.value)
      whereClauses.push(`a.host_id = $${values.length}`)
    }

    if (criteria.participantId) {
      values.push(criteria.participantId.value)
      whereClauses.push(`
        EXISTS (
          SELECT 1
          FROM participations p
          WHERE p.activity_id = a.id
            AND p.user_id = $${values.length}
            AND p.left_at IS NULL
        )
      `)
    }

    if (criteria.minDuration) {
      values.push(criteria.minDuration.value.value)
      const minParamIndex = values.length
      whereClauses.push(`a.min_duration >= $${minParamIndex}`)
    }

    if (criteria.maxDuration) {
      values.push(criteria.maxDuration.value.value)
      const maxParamIndex = values.length
      whereClauses.push(`a.max_duration <= $${maxParamIndex}`)
    }

    if (criteria.minFreeSlots) {
      values.push(criteria.minFreeSlots.value)
      const freeSlotsParamIndex = values.length
      whereClauses.push(`(a.max_capacity - a.current_participants) >= $${freeSlotsParamIndex}`)
    }

    if (criteria.levelIds && criteria.levelIds.length > 0) {
      const levelValues = criteria.levelIds.map((id) => id.value)
      values.push(levelValues)
      const levelParamIndex = values.length

      whereClauses.push(`a.level_ids && $${levelParamIndex}::uuid[]`)
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const sortColumn = criteria.sortBy === 'date' ? 'a.scheduled_at' : '(a.max_capacity - a.current_participants)'
    const sortDir = criteria.sortDirection.toUpperCase()

    values.push(criteria.limit, criteria.offset)

    const limitSQL = `LIMIT $${values.length - 1} OFFSET $${values.length}`

    const sql = `
      SELECT
        a.id,
        a.title,
        a.description,
        a.status,
        a.level_ids,
        a.sport_id,
        a.host_id,
        a.min_capacity,
        a.max_capacity,
        a.min_duration,
        a.max_duration,
        a.current_participants,
        a.scheduled_at,
        a.created_at,

        CASE
          WHEN a.activity_config->'specs'->'team_participants' IS NOT NULL
            THEN json_build_object(
            'minTeams',       (a.activity_config->'specs'->'team_participants'->>'minTeams')::int,
            'maxTeams',       (a.activity_config->'specs'->'team_participants'->>'maxTeams')::int,
            'playersPerTeam', (a.activity_config->'specs'->'team_participants'->>'playersPerTeam')::int
                 )
          ELSE NULL
          END as team_config,

        ST_AsGeoJSON(a.location)::jsonb as location_geojson,

        json_build_object(
          'id', s.id,
          'slug', s.slug,
          'imageUrl', s.image_url
        ) as sport,

        CASE
          WHEN h.id IS NOT NULL AND h.deleted_at IS NULL AND h.status = 'active'
          THEN json_build_object('id', h.id, 'name', h.name, 'username', h.username)
          ELSE NULL
        END as host,

        (
          SELECT json_build_object('id', p.id, 'userId', p.user_id, 'joinedAt', p.joined_at)
          FROM participations p
          WHERE p.activity_id = a.id
            AND p.user_id = $1
            AND p.left_at IS NULL
          LIMIT 1
        ) as current_participation,

        COUNT(*) OVER()::int AS total_count

      FROM activities a
      INNER JOIN sports s ON s.id = a.sport_id
      LEFT JOIN users h ON h.id = a.host_id
      ${whereSQL}
      ORDER BY ${sortColumn} ${sortDir}
      ${limitSQL}
    `

    const rawResults = await this.entityManager.query<Array<ActivityListItemReadModelWithoutLevels>>(sql, values)

    if (rawResults.length === 0) {
      return {
        items: [],
        total: 0,
        hasPrevious: false,
        hasNext: false,
      }
    }

    const totalItems = rawResults[0].total_count

    const itemsWithLevels = rawResults.map((itemWithoutLevels) => this.addLevels(itemWithoutLevels))

    return {
      items: itemsWithLevels,
      total: totalItems,
      hasNext: criteria.offset + criteria.limit < totalItems,
      hasPrevious: criteria.page.value > 1,
    }
  }

  private addLevels(raw: ActivityListItemReadModelWithoutLevels): ActivityListItemReadModel {
    const levels: Array<SportLevelReadModel> = raw.level_ids.map((levelId) => {
      const level = BasicSportRankingSystem.find((rankingId) => rankingId.id.value === levelId)

      return {
        id: level!.id.value,
        slug: level!.slug.value,
        order: level!.order,
        imageUrl: level!.imageUrl ? level!.imageUrl.value : null,
      }
    })

    return {
      ...raw,
      levels,
    }
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
