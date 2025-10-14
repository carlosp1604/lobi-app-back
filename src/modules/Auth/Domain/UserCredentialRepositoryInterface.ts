import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

export interface UserCredentialRepositoryInterface {
  /**
   * Persists the last successful login access for the given UserCredential
   * @param userCredential UserCredential to update
   * @param context the transactional context
   */
  saveLoginSuccess(userCredential: UserCredential, context: TxContext): Promise<void>
}
