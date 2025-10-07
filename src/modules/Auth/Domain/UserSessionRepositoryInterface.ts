import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

export interface UserSessionRepositoryInterface {
  /**
   * Persists the given user session
   * @param userSession the session to save
   * @param context the transactional context
   */
  save(userSession: UserSession, context: TxContext): Promise<void>

  /**
   * Revokes the oldest sessions for the given user (if necessary) and
   * persists the given new session atomically, ensuring the maximum number
   * of active sessions is not exceeded.
   *
   * @param userSession the new session to insert
   * @param maxSessions the maximum allowed number of active sessions (including this new one)
   * @param context the transactional context
   * @returns a promise that resolves with the number of sessions revoked and the id of the inserted session
   */
  revokeOldestAndSave(userSession: UserSession, maxSessions: number, context: TxContext): Promise<void>

  /**
   * Checks whether a session already exists for the given device
   * @param userSession the session containing device information
   * @returns true if a session for the device exists, otherwise false
   */
  existsDevice(userSession: UserSession): Promise<boolean>
}
