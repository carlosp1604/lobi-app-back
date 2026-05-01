import { EntityManager } from 'typeorm'
import { SportEntity, SportRawModel } from '~/src/modules/Activity/Infrastructure/Entities/sport.entity'

export class SportDatabaseHelper {
  constructor(private readonly entityManager: EntityManager) {}

  public async save(raw: SportRawModel): Promise<void> {
    const sportRepository = this.entityManager.getRepository(SportEntity)

    await sportRepository.save(raw)
  }
}
