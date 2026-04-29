import { Sport } from '~/src/modules/Activity/Domain/Sport/Sport'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { SportEntity } from '~/src/modules/Activity/Infrastructure/Entities/sport.entity'
import { SportModelTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/SportModelTranslator'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { SportRepositoryInterface } from '~/src/modules/Activity/Domain/Sport/SportRepositoryInterface'

export class PostgreSqlSportRepository implements SportRepositoryInterface {
  constructor(private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Finds a sport by ID
   * @param id Sport ID
   * @param context The transactional context
   * @returns The Sport entity if found, otherwise null
   */
  public async findById(id: Identifier, context?: TxContext): Promise<Sport | null> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const sportRepository = entityManager.getRepository(SportEntity)

    const sportEntity = await sportRepository.findOneBy({ id: id.value })

    if (!sportEntity) {
      return null
    }

    return SportModelTranslator.toDomain(sportEntity)
  }
}
