import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { Participation } from '~/src/modules/Activity/Domain/Participation'

export interface ParticipationRepositoryInterface {
  /**
   * Persists the given participation
   * @param participation Participation to save
   * @param context The transactional context
   */
  save(participation: Participation, context?: TxContext): Promise<void>
}
