import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'

export interface VerificationTokenRepositoryInterface {
  /**
   * Finds a specific VerificationToken by email (and acquires a pessimistic lock on the row)
   * @param email User email
   * @param context The transactional context
   * @returns The locked VerificationToken entity if found, otherwise null
   */
  findByEmailWithLock(email: string, context: TxContext): Promise<VerificationToken | null>

  /**
   * Finds a specific VerificationToken by email
   * @param email User email
   * @returns The VerificationToken entity if found, otherwise null
   */
  findByEmail(email: string): Promise<VerificationToken | null>

  /**
   * Saves a VerificationToken in the database
   * @param verificationToken The VerificationToken domain entity to persist
   * @param context The transactional context
   */
  save(verificationToken: VerificationToken, context: TxContext): Promise<void>

  /**
   * Updates an existing VerificationToken in the database
   * @param verificationToken The VerificationToken domain entity to update
   * @param context The transactional context
   */
  update(verificationToken: VerificationToken, context: TxContext): Promise<void>

  /**
   * Deletes a VerificationToken from the database given its ID
   * @param verificationTokenId VerificationToken ID
   * @param context The transactional context
   */
  delete(verificationTokenId: string, context: TxContext): Promise<void>
}
