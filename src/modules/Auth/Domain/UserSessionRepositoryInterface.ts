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
   * Counts the number of active sessions for the given user
   * @param userId the ID of the user
   * @param context the transactional context
   * @returns the number of active sessions
   */
  countActiveSessions(userId: string, context: TxContext): Promise<number>

  /**
   * Revokes the oldest session if the number of active sessions exceeds the given maximum
   * @param userId the ID of the user
   * @param context the transactional context
   * @param maxSessions the maximum allowed number of active sessions
   */
  revokeOldestIfExceeds(userId: string, maxSessions: number, context: TxContext): Promise<void>

  /**
   * Checks whether a session already exists for the given device
   * @param userSession the session containing device information
   * @param context the transactional context
   * @returns true if a session for the device exists, otherwise false
   */
  existsDevice(userSession: UserSession, context: TxContext): Promise<boolean>
}
