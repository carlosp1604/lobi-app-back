import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'

export class UserNameMother {
  static valid(): UserName {
    return UserName.fromString('User Test')
  }
}
