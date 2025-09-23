import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

export interface UserCredentialRepositoryInterface {
  /**
   * Persists the updated failed-attempts counter for the given UserCredential
   * @param userCredential UserCredential to update
   * @param context the transactional context
   */
  saveFailedAttempts(userCredential: UserCredential, context: TxContext): Promise<void>

  /**
   * Persists the locked state of the given UserCredential
   * @param userCredential UserCredential to update
   * @param context the transactional context
   */
  saveLock(userCredential: UserCredential, context: TxContext): Promise<void>

  /**
   * Persists the last successful login access for the given UserCredential
   * @param userCredential UserCredential to update
   * @param context the transactional context
   */
  saveLoginSuccess(userCredential: UserCredential, context: TxContext): Promise<void>
}
