import { EmailAddressMother } from '~/src/test/mothers/EmailAddressMother'
import { VerificationTokenEmail } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenEmail'

export class VerificationTokenEmailMother extends EmailAddressMother {
  public static valid(): VerificationTokenEmail {
    return VerificationTokenEmail.fromString(this.validString())
  }

  public static random(): VerificationTokenEmail {
    return VerificationTokenEmail.fromString(this.randomValidString())
  }

  public static invalid(): string {
    return EmailAddressMother.invalidValue()
  }
}
