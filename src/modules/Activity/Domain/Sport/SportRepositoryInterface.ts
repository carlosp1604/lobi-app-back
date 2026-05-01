import { Sport } from '~/src/modules/Activity/Domain/Sport/Sport'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

export interface SportRepositoryInterface {
  /**
   * Finds a sport by ID
   * @param id Sport ID
   * @param context The transactional context
   * @returns The Sport entity if found, otherwise null
   */
  findById(id: Identifier, context?: TxContext): Promise<Sport | null>
}
