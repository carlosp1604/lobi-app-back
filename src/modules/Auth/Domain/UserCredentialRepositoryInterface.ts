import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

export interface UserCredentialRepositoryInterface {
  /**
   * Persists a new UserCredential in the database
   * @param userCredential The UserCredential domain entity to insert
   * @param context The transactional context
   */
  save(userCredential: UserCredential, context?: TxContext): Promise<void>

  /**
   * Persists the last successful login access for the given UserCredential
   * @param userCredential UserCredential to update
   * @param context The transactional context
   */
  saveLoginSuccess(userCredential: UserCredential, context: TxContext): Promise<void>

  /**
   * Finds the UserCredential entity for a given user ID
   * @param userId User ID
   * @param context The transactional context
   * @returns UserCredential entity if found, otherwise null
   */
  findByUserId(userId: string, context?: TxContext): Promise<UserCredential | null>
}
