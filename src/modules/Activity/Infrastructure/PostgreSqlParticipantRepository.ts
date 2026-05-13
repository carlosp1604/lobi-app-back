import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { Participant } from '~/src/modules/Activity/Domain/Participant/Participant'
import { ParticipantEntity } from '~/src/modules/Activity/Infrastructure/Entities/participant.entity'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { ParticipantModelTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/ParticipantModelTranslator'
import { ParticipantRepositoryInterface } from '~/src/modules/Activity/Domain/Participant/ParticipantRepositoryInterface'

export class PostgreSqlParticipantRepository implements ParticipantRepositoryInterface {
  constructor(private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Finds a participant by ID
   * @param id Participant ID
   * @param context The transactional context
   * @returns The Participant entity if found, otherwise null
   */
  public async findById(id: Identifier, context?: TxContext): Promise<Participant | null> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const participantRepository = entityManager.getRepository(ParticipantEntity)

    const participantEntity = await participantRepository.findOneBy({ id: id.value })

    if (!participantEntity) {
      return null
    }

    return ParticipantModelTranslator.toDomain(participantEntity)
  }
}
