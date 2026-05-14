import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { Participation } from '~/src/modules/Activity/Domain/Participation/Participation'

export interface ParticipationRepositoryInterface {
  /**
   * Persists the given participation
   * @param participation Participation to save
   * @param context The transactional context
   */
  save(participation: Participation, context?: TxContext): Promise<void>

  /**
   * Finds a participation by its participant and activity ID
   * @param participantId Participation owner ID
   * @param activityId Participation activity ID
   * @param context The transactional context
   * @returns The Participation if found, otherwise null
   */
  findByParticipantAndActivityId(participantId: Identifier, activityId: Identifier, context?: TxContext): Promise<Participation | null>

  /**
   * Finds a host candidate by selecting the oldest active participant, excluding the current host
   * @param activityId Activity ID
   * @param hostId Current host ID to exclude
   * @param context The transactional context
   * @returns The Participation if found, otherwise null
   */
  findHostCandidate(activityId: Identifier, hostId: Identifier, context?: TxContext): Promise<Participation | null>
}
