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

  findByIdWithSessions(id: string, context?: TxContext): Promise<User | null>

  findByIdWithLockWithSessions(id: string, context: TxContext): Promise<User | null>

  save(user: User, context: TxContext): Promise<void>
}
