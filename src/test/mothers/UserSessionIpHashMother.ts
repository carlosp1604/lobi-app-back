import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { randomBytes } from 'crypto'

export class UserSessionIpHashMother {
  static valid(): UserSessionIpHash {
    return UserSessionIpHash.fromString('X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=')
  }

  static random(): UserSessionIpHash {
    const hash = randomBytes(32).toString('base64')
    return UserSessionIpHash.fromString(hash)
  }
}
