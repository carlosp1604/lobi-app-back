import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { EntityManager } from 'typeorm'
import { SportLevelReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportLevelReadModel'
import { ActivityFinderInterface } from '~/src/modules/Activity/Application/GetActivity/ActivityFinderInterface'
import { BasicSportRankingSystem } from '~/src/modules/Activity/Domain/Sport/Ranking/BasicSportRankingSystem'
import {
  ActivityDetailsReadModel,
  ActivityDetailsReadModelWithoutLevels,
} from '~/src/modules/Activity/Application/ReadModel/ActivityDetailsReadModel'

export class PostgreSqlActivityFinder implements ActivityFinderInterface {
  constructor(private readonly entityManager: EntityManager) {}

  /**
   * Finds an activity by ID
   * If a User ID is provided, it includes the user's relationship context for each activity
   * @param activityId Activity ID
   * @param userId User ID
   * @returns ActivityDetailsReadModel If activity is found, otherwise null
   */
  public async find(activityId: Identifier, userId: Identifier | null): Promise<ActivityDetailsReadModel | null> {
    const rawResult: Array<ActivityDetailsReadModelWithoutLevels> = await this.entityManager.query(
      `
        SELECT
          a.*,
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
            SELECT json_build_object('id', p.id, 'joinedAt', p.joined_at, 'leftAt', p.left_at)
            FROM participations p
            WHERE p.activity_id = a.id
              AND p.user_id = $2
              AND p.left_at IS NULL
            LIMIT 1
          ) as current_participation

        FROM activities a
        INNER JOIN sports s ON s.id = a.sport_id
        LEFT JOIN users h ON h.id = a.host_id
        WHERE a.id = $1
      `,
      [activityId.value, userId?.value ?? null],
    )

    if (rawResult.length === 0) {
      return null
    }

    return this.addLevels(rawResult[0])
  }

  private addLevels(raw: ActivityDetailsReadModelWithoutLevels): ActivityDetailsReadModel {
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
