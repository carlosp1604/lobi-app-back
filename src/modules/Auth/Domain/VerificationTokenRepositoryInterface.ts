import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

export interface VerificationTokenRepositoryInterface {
  findByEmailAndPurposeWithLock(email: string, purpose: string, context: TxContext): Promise<VerificationToken | null>
  save(verificationToken: VerificationToken, context: TxContext): Promise<void>
  delete(verificationToken: VerificationToken, context: TxContext): Promise<void>
}
