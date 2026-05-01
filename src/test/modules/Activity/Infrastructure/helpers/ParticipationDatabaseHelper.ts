import { EntityManager } from 'typeorm'
import { ActivityEntity } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'
import {
  ParticipationEntity,
  ParticipationRawModelWithRelations,
} from '~/src/modules/Activity/Infrastructure/Entities/participation.entity'

export class ParticipationDatabaseHelper {
  constructor(private readonly entityManager: EntityManager) {}

  public async findByActivityIdAndUserId(activityId: string, userId: string): Promise<ParticipationRawModelWithRelations | null> {
    const participationRepository = this.entityManager.getRepository(ParticipationEntity)

    return participationRepository.findOneBy({ activity_id: activityId, user_id: userId })
  }

  public async findById(id: string): Promise<ParticipationRawModelWithRelations | null> {
    const participationRepository = this.entityManager.getRepository(ParticipationEntity)

    return participationRepository.findOneBy({ id })
  }

  public async count(): Promise<number> {
    const activityRepository = this.entityManager.getRepository(ActivityEntity)

    return activityRepository.count()
  }
}
