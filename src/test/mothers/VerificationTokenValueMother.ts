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

  public static invalid(): string {
    const min = 2
    const max = 10
    const length = Math.floor(Math.random() * (max - min + 1)) + min

    let result = ''

    for (let i = 0; i < length; i++) {
      const useOnlyLetters = length === VerificationTokenValue.LENGTH

      if (useOnlyLetters) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        result += letters.charAt(Math.floor(Math.random() * letters.length))
      } else {
        result += String(Math.floor(Math.random() * 10))
      }
    }

    return result
  }
}
