import { VerificationTokenValue } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenValue'

export class VerificationTokenValueMother {
  public static valid(): VerificationTokenValue {
    return VerificationTokenValue.fromString('12345678')
  }

  public static random(): VerificationTokenValue {
    let result = ''

    for (let i = 0; i < VerificationTokenValue.LENGTH; i++) {
      const currentValue = Math.floor(Math.random() * 10)

      result += String(currentValue)
    }

    return VerificationTokenValue.fromString(result)
  }
}
