import { randomBytes } from 'crypto'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'

export class VerificationTokenTokenHashMother {
  static valid(): VerificationTokenTokenHash {
    return VerificationTokenTokenHash.fromString('$2b$10$CwTycUXWue0Thq9StjUM0uJ8FhVG0aUoUsvhj5kLVJk0r8O.3/0Fe')
  }

  static random(): VerificationTokenTokenHash {
    const prefix = '$2b$10$'

    const randomSuffix = randomBytes(40).toString('base64').replace(/\+/g, '.').substring(0, 53)

    return VerificationTokenTokenHash.fromString(`${prefix}${randomSuffix}`)
  }
}
