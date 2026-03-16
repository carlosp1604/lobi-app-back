import { randomBytes } from 'crypto'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'

export class UserIpHashMother {
  public static readonly INVALID_FORMAT_CASES = ['', 'abc', 'a'.repeat(45), '**not-base64**', 'a'.repeat(44)]

  static valid(): UserIpHash {
    return UserIpHash.fromString('pXFhxrG0UilgU4eHWVUXdDAZhkInCSgjZeZDA3QWMBM=')
  }

  static random(): UserIpHash {
    const hash = randomBytes(32).toString('base64')
    return UserIpHash.fromString(hash)
  }

  static invalid(): string {
    return 'not-a-valid-user-ip-hash'
  }
}
