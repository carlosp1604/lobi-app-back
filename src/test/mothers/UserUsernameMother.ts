import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'

export class UserUsernameMother {
  static valid(): UserUsername {
    return UserUsername.fromString('tester')
  }
}
