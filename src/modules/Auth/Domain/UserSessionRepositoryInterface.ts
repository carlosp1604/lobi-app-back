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
   * Revokes the oldest sessions for the given user until the number
   * of active sessions does not exceed the specified maximum
   * @param userId User ID
   * @param maxSessions the maximum allowed number of active sessions
   * @param context the transactional context
   * @returns a promise that resolves when the sessions have been revoked
   */
  revokeOldest(userId: string, maxSessions: number, context: TxContext): Promise<void>

  /**
   * Checks whether a session already exists for the given device
   * @param userSession the session containing device information
   * @returns true if a session for the device exists, otherwise false
   */
  existsDevice(userSession: UserSession): Promise<boolean>
}
