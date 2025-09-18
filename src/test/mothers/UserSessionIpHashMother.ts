import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'

export class UserSessionIpHashMother {
  static valid(): UserSessionIpHash {
    return UserSessionIpHash.fromString('X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=')
  }
}
