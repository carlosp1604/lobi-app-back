import { UserSessionId } from '~/src/modules/Auth/Domain/ValueObject/UserSessionId'

export class UserSessionIdMother {
  static valid(): UserSessionId {
    return UserSessionId.fromString(crypto.randomUUID())
  }
}
