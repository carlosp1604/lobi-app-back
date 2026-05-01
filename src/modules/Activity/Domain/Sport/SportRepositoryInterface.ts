import { Sport } from '~/src/modules/Activity/Domain/Sport/Sport'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

export type SportsWithCount = {
  sports: Array<Sport>
  count: number
}

export interface SportRepositoryInterface {
  /**
   * Finds a sport by ID
   * @param id Sport ID
   * @param context The transactional context
   * @returns The Sport entity if found, otherwise null
   */
  findById(id: Identifier, context?: TxContext): Promise<Sport | null>

  /**
   * Get all sports along with their total count
   * @returns SportsWithCount containing the list of sports and the total count
   */
  getAll(): Promise<SportsWithCount>
}
