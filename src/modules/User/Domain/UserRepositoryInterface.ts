import { User } from '~/src/modules/User/Domain/User'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

export interface UserRepositoryInterface {
  /**
   * Finds a user by email (and acquires a pessimistic lock on the row)
   * @param email User email
   * @param context The transactional context
   * @returns The locked User entity if found, otherwise null
   */
  findByEmailWithLock(email: string, context?: TxContext): Promise<User | null>

  /**
   * Finds a user by ID (and acquires a pessimistic lock on the row)
   * @param id User ID
   * @param context The transactional context
   * @returns The locked User entity if found, otherwise null
   */
  findByIdWithLock(id: string, context: TxContext): Promise<User | null>
}
