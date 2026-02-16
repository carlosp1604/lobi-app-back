import { VerificationTokenValue } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenValue'

export class VerificationTokenValueMother {
  public static readonly INVALID_FORMAT_CASES = ['', '1234567', '123456789', '123a5678', '123 5678', '--------', '        ']

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

  public static invalid(): string {
    return '-1234567'
  }
}
