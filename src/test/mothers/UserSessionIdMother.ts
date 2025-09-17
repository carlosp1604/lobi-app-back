import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'

export class UserSessionIdMother {
  static valid(): UserId {
    return UserId.fromString(crypto.randomUUID())
  }
}
