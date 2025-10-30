import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'

export interface VerificationTokenRepositoryInterface {
  /**
   * Finds a specific VerificationToken by email and purpose (and acquires a pessimistic lock on the row)
   * @param email User email
   * @param purpose VerificationToken purpose
   * @param context The transactional context
   * @returns The locked VerificationToken entity if found, otherwise null
   */
  findByEmailAndPurposeWithLock(email: string, purpose: string, context: TxContext): Promise<VerificationToken | null>

  /**
   * Saves (inserts or update) a VerificationToken in the database
   * @param verificationToken The VerificationToken domain entity to persist
   * @param context The transactional context
   */
  save(verificationToken: VerificationToken, context: TxContext): Promise<void>

  /**
   * Deletes a VerificationToken from the database given its ID
   * @param verificationTokenId VerificationToken ID
   * @param context The transactional context
   */
  delete(verificationTokenId: string, context: TxContext): Promise<void>
}
