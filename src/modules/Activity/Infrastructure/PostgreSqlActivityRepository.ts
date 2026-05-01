import { Activity } from '~/src/modules/Activity/Domain/Activity'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { DomainEventEntity } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { QueryDeepPartialEntity } from 'typeorm/browser/query-builder/QueryPartialEntity'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { ActivityModelTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/ActivityModelTranslator'
import { DomainEventModelTranslator } from '~/src/modules/Shared/Infrastructure/ModelTranslators/DomainEventModelTranslator'
import { ActivityEntity, ActivityRawModelWithRelations } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { SportModelTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/SportModelTranslator'

export class PostgreSqlActivityRepository implements PostgreSqlActivityRepository {
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
}
