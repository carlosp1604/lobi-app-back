import { UserSessionTokenHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionTokenHash'
import { randomBytes } from 'crypto'

export class UserSessionTokenHashMother {
  static valid(): UserSessionTokenHash {
    return UserSessionTokenHash.fromString('X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=')
  }

  static random(): UserSessionTokenHash {
    const hash = randomBytes(32).toString('base64')
    return UserSessionTokenHash.fromString(hash)
  }
}
