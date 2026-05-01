import { EntityManager } from 'typeorm'
import { ActivityEntity, ActivityRawModelWithRelations } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'

export class ActivityDatabaseHelper {
  constructor(private readonly entityManager: EntityManager) {}

  public async findById(id: string): Promise<ActivityRawModelWithRelations | null> {
    const activityRepository = this.entityManager.getRepository(ActivityEntity)

    return activityRepository.findOneBy({ id })
  }

  public async findByHostId(id: string): Promise<Array<ActivityRawModelWithRelations>> {
    const activityRepository = this.entityManager.getRepository(ActivityEntity)

    return activityRepository.findBy({ host_id: id })
  }

  public async count(): Promise<number> {
    const activityRepository = this.entityManager.getRepository(ActivityEntity)

    return activityRepository.count()
  }
}
