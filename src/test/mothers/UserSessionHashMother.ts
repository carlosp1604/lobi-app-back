import { UserSessionHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionHash'

export class UserSessionHashMother {
  static valid(): UserSessionHash {
    return UserSessionHash.fromString('X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=')
  }
}
