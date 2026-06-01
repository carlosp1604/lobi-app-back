import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { EntityManager } from 'typeorm'
import { SportLevelReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportLevelReadModel'
import { GetActivitiesCriteria } from '~/src/modules/Activity/Application/Shared/GetActivitiesCriteria'
import { BasicSportRankingSystem } from '~/src/modules/Activity/Domain/Sport/Ranking/BasicSportRankingSystem'
import { ActivitiesFinderInterface } from '~/src/modules/Activity/Application/Shared/ActivitiesFinderInterface'
import {
  ActivityListReadModel,
  ActivityListItemReadModel,
  ActivityListItemReadModelWithoutLevels,
} from '~/src/modules/Activity/Application/ReadModel/ActivityListReadModel'

export class PostgreSqlActivitiesFinder implements ActivitiesFinderInterface {
  constructor(private readonly entityManager: EntityManager) {}

  /**
   * Finds activities based on the provided criteria
   * If a User ID is provided, it includes the user's relationship context for each activity
   * @param criteria Criteria to apply to the search
   * @param userId User ID
   * @param now The current date to evaluate temporal filters
   * @returns ActivityListReadModel with the results
   */
  public async find(criteria: GetActivitiesCriteria, userId: Identifier | null, now: Date): Promise<ActivityListReadModel> {
    const values: any[] = []

    values.push(userId?.value ?? null)

    const whereClauses: string[] = []

    if (criteria.location && criteria.radius) {
      values.push(criteria.location.value.lng.stringValue, criteria.location.value.lat.stringValue, criteria.radius.value)
      whereClauses.push(
        `ST_DWithin(a.location::geography, ST_SetSRID(ST_MakePoint($${values.length - 2}, $${values.length - 1}), 4326)::geography, $${values.length})`,
      )
    }

    if (criteria.maxDateSeconds) {
      values.push(now)
      const nowParamIndex = values.length

      values.push(criteria.maxDateSeconds.value)
      const secondsParamIndex = values.length

      whereClauses.push(`a.scheduled_at >= $${nowParamIndex}::timestamptz`)

      whereClauses.push(`a.scheduled_at <= $${nowParamIndex}::timestamptz + ($${secondsParamIndex} * INTERVAL '1 second')`)
    }

    if (criteria.statuses && criteria.statuses.length > 0) {
      values.push(criteria.statuses.map((s) => s.value))
      whereClauses.push(`a.status = ANY($${values.length})`)
    }

    if (criteria.sportId) {
      values.push(criteria.sportId.value)
      whereClauses.push(`a.sport_id = $${values.length}`)
    }

    const userClauses: string[] = []

    if (criteria.hostId) {
      values.push(criteria.hostId.value)
      userClauses.push(`a.host_id = $${values.length}`)
    }

    if (criteria.participantId) {
      values.push(criteria.participantId.value)
      userClauses.push(`
        EXISTS (
          SELECT 1
          FROM participations p
          WHERE p.activity_id = a.id
            AND p.user_id = $${values.length}
            AND p.left_at IS NULL
        )
      `)
    }

    if (userClauses.length > 0) {
      whereClauses.push(`(${userClauses.join(' OR ')})`)
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

    const offset = (criteria.page.value - 1) * criteria.perPage.value
    const limit = criteria.perPage.value

    values.push(limit, offset)

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
      hasNext: offset + limit < totalItems,
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
}
