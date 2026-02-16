import { EntityManager } from 'typeorm'

import {
  SportsmanProfileEntity,
  SportsmanProfileRawWithRelationships,
} from '~/src/modules/User/Infrastructure/Entities/Profiles/sportsman-profile.entity'

export class SportsmanProfileDatabaseHelper {
  constructor(private readonly entityManager: EntityManager) {}

  public async save(sportsmen: Array<SportsmanProfileRawWithRelationships> | SportsmanProfileRawWithRelationships) {
    const sportsmanProfileRepository = this.entityManager.getRepository(SportsmanProfileEntity)

    if (Array.isArray(sportsmen)) {
      await sportsmanProfileRepository.save(sportsmen)
    } else {
      await sportsmanProfileRepository.save(sportsmen)
    }
  }

  public async findById(profileId: string): Promise<SportsmanProfileRawWithRelationships | null> {
    const sportsmanProfileRepository = this.entityManager.getRepository(SportsmanProfileEntity)

    return sportsmanProfileRepository.findOneBy({ id: profileId })
  }

  public async count(): Promise<number> {
    const sportsmanProfileRepository = this.entityManager.getRepository(SportsmanProfileEntity)

    return sportsmanProfileRepository.count()
  }
}
