import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { EntityManager } from 'typeorm'
import { GetActivityQuery } from '~/src/modules/Activity/Application/GetActivity/GetActivityQuery'
import { SportLevelReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportLevelReadModel'
import { GetActivityQueryError } from '~/src/modules/Activity/Application/GetActivity/GetActivityQueryError'
import { Result, fail, success } from '~/src/modules/Shared/Domain/Result'
import { SpecTranslatorFactory } from '~/src/modules/Activity/Application/Translator/Config/Spec/SpecTranslatorFactory'
import { BasicSportRankingSystem } from '~/src/modules/Activity/Domain/Sport/Ranking/BasicSportRankingSystem'
import { CapabilityTranslatorFactory } from '~/src/modules/Activity/Application/Translator/Config/Capability/CapabilityTranslatorFactory'
import { GetActivityQueryResponseDto } from '~/src/modules/Activity/Application/GetActivity/GetActivityQueryResponseDto'
import { GetActivityQueryResponseDtoTranslator } from '~/src/modules/Activity/Application/GetActivity/GetActivityQueryResponseDtoTranslator'
import {
  ActivityDetailsReadModel,
  ActivityDetailsReadModelWithoutLevels,
} from '~/src/modules/Activity/Application/ReadModel/ActivityDetailsReadModel'

type ValidatedQueryData = {
  userId: Identifier | null
  activityId: Identifier
}

export class GetActivityQueryHandler {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly capabilityTranslatorFactory: CapabilityTranslatorFactory,
    private readonly specTranslatorFactory: SpecTranslatorFactory,
  ) {}

  public async execute(query: GetActivityQuery): Promise<Result<GetActivityQueryResponseDto, GetActivityQueryError>> {
    const validatedQueryDataResult = this.validateQueryData(query)

    if (!validatedQueryDataResult.success) {
      return validatedQueryDataResult
    }

    const { userId, activityId } = validatedQueryDataResult.value

    const data = await this.runQuery(activityId, userId)

    if (!data) {
      return fail(GetActivityQueryError.activityNotFound())
    }

    return success(
      new GetActivityQueryResponseDtoTranslator(this.capabilityTranslatorFactory, this.specTranslatorFactory).translate({
        rawData: data,
        userId,
      }),
    )
  }

  private validateQueryData(request: GetActivityQuery): Result<ValidatedQueryData, GetActivityQueryError> {
    let userId: Identifier | null = null

    if (request.userId) {
      const userIdResult = Identifier.safeCreate(request.userId)

      if (!userIdResult.success) {
        return fail(GetActivityQueryError.invalidUserId(userIdResult.error.message))
      }

      userId = userIdResult.value
    }

    const activityIdResult = Identifier.safeCreate(request.activityId)

    if (!activityIdResult.success) {
      return fail(GetActivityQueryError.invalidActivityId(activityIdResult.error.message))
    }

    const activityId = activityIdResult.value

    return success({ userId, activityId })
  }

  private async runQuery(activityId: Identifier, userId: Identifier | null): Promise<ActivityDetailsReadModel | null> {
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
