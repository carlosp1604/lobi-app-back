import { randomBytes } from 'crypto'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'

export class UserSessionIpHashMother {
  static valid(): UserSessionIpHash {
    return UserSessionIpHash.fromString('pXFhxrG0UilgU4eHWVUXdDAZhkInCSgjZeZDA3QWMBM=')
  }

  static random(): UserSessionIpHash {
    const hash = randomBytes(32).toString('base64')
    return UserSessionIpHash.fromString(hash)
  }
}
