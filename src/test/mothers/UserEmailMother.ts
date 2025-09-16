import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'

export class UserEmailMother {
  static valid(): UserEmail {
    return UserEmail.fromString('test@example.com')
  }
}
