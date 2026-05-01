import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { Participation } from '~/src/modules/Activity/Domain/Participation'
import { ParticipationEntity } from '~/src/modules/Activity/Infrastructure/Entities/participation.entity'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { ParticipationModelTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/ParticipationModelTranslator'
import { ParticipationRepositoryInterface } from '~/src/modules/Activity/Domain/ParticipationRepositoryInterface'

export class PostgreSqlParticipationRepository implements ParticipationRepositoryInterface {
  constructor(private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Persists the given participation
   * @param participation Participation to save
   * @param context The transactional context
   */
  public async save(participation: Participation, context?: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const participationRepository = entityManager.getRepository(ParticipationEntity)

    const participationRawModel = ParticipationModelTranslator.toDatabase(participation)

    await participationRepository.insert(participationRawModel)
  }
}
