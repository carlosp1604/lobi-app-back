import { VerificationTokenId } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenId'

export class VerificationTokenIdMother {
  static valid(): VerificationTokenId {
    return VerificationTokenId.fromString(crypto.randomUUID())
  }
}
