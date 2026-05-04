import { Activity } from '~/src/modules/Activity/Domain/Activity'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { DomainEventEntity } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { ActivityDetailsModel } from '~/src/modules/Activity/Domain/ReadModel/ActivityDetailsModel'
import { SportModelTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/SportModelTranslator'
import { QueryDeepPartialEntity } from 'typeorm/browser/query-builder/QueryPartialEntity'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { ActivityModelTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/ActivityModelTranslator'
import { DomainEventModelTranslator } from '~/src/modules/Shared/Infrastructure/ModelTranslators/DomainEventModelTranslator'
import { ActivityDetailsModelTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/ActivityDetailsModelTranslator'
import { ActivityEntity, ActivityRawModelWithRelations } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'
import { ActivityRepositoryInterface } from '~/src/modules/Activity/Domain/ActivityRepositoryInterface'
import { ActivityHostRawModel } from '~/src/modules/Activity/Infrastructure/Entities/activity-host.entity'

export class PostgreSqlActivityRepository implements ActivityRepositoryInterface {
  constructor(private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Persists the given activity
   * @param activity Activity to save
   * @param context The transactional context
   */
  public async save(activity: Activity, context?: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const activityRepository = entityManager.getRepository(ActivityEntity)

    const activityRawModel = ActivityModelTranslator.toDatabase(activity)

    await activityRepository.insert(activityRawModel as QueryDeepPartialEntity<ActivityRawModelWithRelations>)

    const pendingDomainEvents = activity.pullDomainEvents()

    if (pendingDomainEvents.length) {
      const domainEventRepository = entityManager.getRepository(DomainEventEntity)

      const domainEventRawModels = pendingDomainEvents.map((domainEvent) => DomainEventModelTranslator.toDatabase(domainEvent))

      await domainEventRepository.insert(domainEventRawModels)
    }
  }

  /**
   * Finds an activity by ID
   * @param id Activity ID
   * @param context The transactional context
   * @returns The Activity entity if found, otherwise null
   */
  public async findById(id: Identifier, context?: TxContext): Promise<Activity | null> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const activityRepository = entityManager.getRepository(ActivityEntity)

    const activityEntity = await activityRepository.findOne({ where: { id: id.value }, relations: { sport: true } })

    if (!activityEntity) {
      return null
    }

    if (!activityEntity.sport) {
      throw new Error(`Inconsistent state: Activity ${activityEntity.id} loaded without a Sport.`)
    }

    const sport = SportModelTranslator.toDomain(activityEntity.sport)

    return ActivityModelTranslator.toDomain(activityEntity, sport)
  }

  /**
   * Finds activity details by ID
   * @param id Activity ID
   * @param participantId Participant ID
   * @returns The ActivityDetailsModel if found, otherwise null
   */
  public async findDetailsById(id: Identifier, participantId: Identifier | null): Promise<ActivityDetailsModel | null> {
    const entityManager = this.entityManagerResolver.resolve()
    const activityRepository = entityManager.getRepository(ActivityEntity)

    const query = activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.sport', 'sport')
      .leftJoin('users', 'host', 'host.id = activity.host_id')
      .addSelect(['host.id', 'host.username', 'host.name', 'host.status', 'host.user_upload_id', 'host.deleted_at'])
      .leftJoinAndSelect(
        'activity.participations',
        'participation',
        '"participation"."activity_id" = "activity"."id" AND "participation"."user_id" = :participantId',
        { participantId: participantId?.value ?? null },
      )
      .where('activity.id = :id', { id: id.value })
      .withDeleted()

    const { entities, raw } = await query.getRawAndEntities()

    if (entities.length === 0) {
      return null
    }

    const result = entities[0]
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const rawResult = raw[0]

    if (!result.sport) {
      throw new Error(`Inconsistent state: Activity ${result.id} loaded without a Sport`)
    }

    const hostRawData: ActivityHostRawModel = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      id: rawResult.host_id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      username: rawResult.host_username,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      name: rawResult.host_name,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      status: rawResult.host_status,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      user_upload_id: rawResult.host_user_upload_id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      deleted_at: rawResult.host_deleted_at,
    }

    if (!hostRawData.id) {
      throw new Error(`Inconsistent state: Activity ${result.id} loaded without a Host`)
    }

    const participation = result.participations && result.participations.length > 0 ? result.participations[0] : null

    return ActivityDetailsModelTranslator.toDomain(result, result.sport, hostRawData, participation)
  }
}
