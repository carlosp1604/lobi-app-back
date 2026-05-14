import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { IsNull, Not } from 'typeorm'
import { Participation } from '~/src/modules/Activity/Domain/Participation/Participation'
import { ParticipationEntity } from '~/src/modules/Activity/Infrastructure/Entities/participation.entity'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { ParticipationModelTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/ParticipationModelTranslator'
import { ParticipationRepositoryInterface } from '~/src/modules/Activity/Domain/Participation/ParticipationRepositoryInterface'

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

    await participationRepository.save(participationRawModel)
  }

  /**
   * Finds a participation by its participant and activity ID
   * @param participantId Participation owner ID
   * @param activityId Participation activity ID
   * @param context The transactional context
   * @returns The Participation if found, otherwise null
   */
  public async findByParticipantAndActivityId(
    participantId: Identifier,
    activityId: Identifier,
    context?: TxContext,
  ): Promise<Participation | null> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const participationRepository = entityManager.getRepository(ParticipationEntity)

    const participationEntity = await participationRepository.findOneBy({ user_id: participantId.value, activity_id: activityId.value })

    if (!participationEntity) {
      return null
    }

    return ParticipationModelTranslator.toDomain(participationEntity)
  }

  /**
   * Finds a host candidate by selecting the oldest active participant, excluding the current host
   * @param activityId Activity ID
   * @param hostId Current host ID to exclude
   * @param context The transactional context
   * @returns The Participation if found, otherwise null
   */
  public async findHostCandidate(activityId: Identifier, hostId: Identifier, context?: TxContext): Promise<Participation | null> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const participationRepository = entityManager.getRepository(ParticipationEntity)

    const participationEntity = await participationRepository.findOne({
      where: {
        activity_id: activityId.value,
        user_id: Not(hostId.value),
        left_at: IsNull(),
      },
      order: {
        joined_at: 'ASC',
      },
    })

    if (!participationEntity) {
      return null
    }

    return ParticipationModelTranslator.toDomain(participationEntity)
  }
}
