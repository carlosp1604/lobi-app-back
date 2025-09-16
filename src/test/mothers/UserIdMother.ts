import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'

export class UserIdMother {
  static valid(): UserId {
    return UserId.fromString(crypto.randomUUID())
  }
}
