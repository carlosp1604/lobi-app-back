import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'

export interface UserSessionRepositoryInterface {
  /**
   * Persists multiple UserSessions
   * @param userSessions The array of sessions to save
   * @param context The transactional context
   */
  save(userSessions: Array<UserSession>, context: TxContext): Promise<void>

  /**
   * Finds all active (non-revoked and non-expired) sessions for a given user
   * @param userId User ID
   * @param now The current date and time
   * @param context The transactional context
   * @returns Array of active UserSession
   */
  findUserActiveSessions(userId: string, now: Date, context: TxContext): Promise<Array<UserSession>>

  /**
   * Finds a UserSession by its token hash
   * @param hash The unique hash of the session token
   * @param context The transactional context
   * @returns The UserSession if found, otherwise null
   */
  findByHash(hash: string, context: TxContext): Promise<UserSession | null>

  /**
   * Finds a UserSession by ID
   * @param id UserSession ID
   * @param context The transactional context
   * @returns The UserSession if found, otherwise null
   */
  findById(id: Identifier, context: TxContext): Promise<UserSession | null>
}
