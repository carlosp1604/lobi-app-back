import { EntityManager } from 'typeorm'
import {
  OwnerProfileEntity,
  OwnerProfileRawWithRelationships,
} from '~/src/modules/User/Infrastructure/Entities/Profiles/owner-profile.entity'

export class OwnerProfileDatabaseHelper {
  constructor(private readonly entityManager: EntityManager) {}

  public async save(owners: Array<OwnerProfileRawWithRelationships> | OwnerProfileRawWithRelationships) {
    const ownerProfileRepository = this.entityManager.getRepository(OwnerProfileEntity)

    if (Array.isArray(owners)) {
      await ownerProfileRepository.save(owners)
    } else {
      await ownerProfileRepository.save(owners)
    }
  }

  public async findById(profileId: string): Promise<OwnerProfileRawWithRelationships | null> {
    const ownerProfileRepository = this.entityManager.getRepository(OwnerProfileEntity)

    return ownerProfileRepository.findOneBy({ id: profileId })
  }

  public async count(): Promise<number> {
    const ownerProfileRepository = this.entityManager.getRepository(OwnerProfileEntity)

    return ownerProfileRepository.count()
  }
}
