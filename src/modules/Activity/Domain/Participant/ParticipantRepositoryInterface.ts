import { Participant } from '~/src/modules/Activity/Domain/Participant/Participant'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

export interface ParticipantRepositoryInterface {
  /**
   * Finds a participant by ID
   * @param id Participant ID
   * @param context The transactional context
   * @returns The Participant entity if found, otherwise null
   */
  findById(id: Identifier, context?: TxContext): Promise<Participant | null>
}
