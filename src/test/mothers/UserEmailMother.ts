import { EmailAddressMother } from '~/src/test/mothers/EmailAddressMother'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'

export class UserEmailMother extends EmailAddressMother {
  public static valid(): UserEmail {
    return UserEmail.fromString(this.validString())
  }

  public static random(): UserEmail {
    return UserEmail.fromString(this.randomValidString())
  }
}
