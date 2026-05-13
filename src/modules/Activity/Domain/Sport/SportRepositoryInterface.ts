import { Sport } from '~/src/modules/Activity/Domain/Sport/Sport'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'

export interface SportRepositoryInterface {
  /**
   * Finds a sport by ID
   * @param id Sport ID
   * @param context The transactional context
   * @returns The Sport entity if found, otherwise null
   */
  findById(id: Identifier, context?: TxContext): Promise<Sport | null>
}
