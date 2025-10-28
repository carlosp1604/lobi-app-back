import { randomBytes } from 'crypto'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'

export class VerificationTokenTokenHashMother {
  static valid(): VerificationTokenTokenHash {
    return VerificationTokenTokenHash.fromString('X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=')
  }

  static random(): VerificationTokenTokenHash {
    const hash = randomBytes(32).toString('base64')
    return VerificationTokenTokenHash.fromString(hash)
  }
}
