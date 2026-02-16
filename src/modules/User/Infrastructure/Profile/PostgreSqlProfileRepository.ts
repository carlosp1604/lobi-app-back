import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { OwnerProfile } from '~/src/modules/User/Domain/Profile/OwnerProfile'
import { SportsmanProfile } from '~/src/modules/User/Domain/Profile/SportsmanProfile'
import { OwnerProfileEntity } from '~/src/modules/User/Infrastructure/Entities/Profiles/owner-profile.entity'
import { SportsmanProfileEntity } from '~/src/modules/User/Infrastructure/Entities/Profiles/sportsman-profile.entity'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { ProfileRepositoryInterface } from '~/src/modules/User/Domain/Profile/ProfileRepositoryInterface'
import { OwnerProfileModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/Profile/OwnerProfileModelTranslator'
import { SportsmanProfileModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/Profile/SportsmanProfileModelTranslator'

export class PostgreSqlProfileRepository implements ProfileRepositoryInterface {
  constructor(private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Persists a new Owner Profile in the database
   * @param ownerProfile The OwnerProfile domain entity to insert
   * @param context The transactional context
   */
  public async saveOwnerProfile(ownerProfile: OwnerProfile, context?: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const repository = entityManager.getRepository(OwnerProfileEntity)

    const rawModel = OwnerProfileModelTranslator.toDatabase(ownerProfile)

    await repository.insert(rawModel)
  }

  /**
   * Persists a new Sportsman Profile in the database
   * @param sportsmanProfile The SportsmanProfile domain entity to insert
   * @param context The transactional context
   */
  public async saveSportsmanProfile(sportsmanProfile: SportsmanProfile, context?: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const repository = entityManager.getRepository(SportsmanProfileEntity)

    const rawModel = SportsmanProfileModelTranslator.toDatabase(sportsmanProfile)

    await repository.insert(rawModel)
  }
}
