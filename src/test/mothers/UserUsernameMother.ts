import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'

export class UserUsernameMother {
  public static readonly INVALID_FORMAT_CASES = [
    '',
    'abc',
    'abcde',
    'a bcd',
    'abcd!',
    'abcd-efg',
    'abc\ndef',
    'abc\tdef',
    'a'.repeat(33),
    '....',
    '____',
    '.abc',
    '_abc',
    'abc.',
    'abc_',
    'ab..cd',
    'ab__cd',
    'ab._cd',
    'ab_.cd',
  ]

  static valid(): UserUsername {
    return UserUsername.fromString('tester')
  }

  public static randomString(): string {
    const alphanumerics = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const separators = '._'

    const length = Math.floor(Math.random() * (32 - 6 + 1)) + 6

    let result = ''

    result += alphanumerics.charAt(Math.floor(Math.random() * alphanumerics.length))

    let lastWasSeparator = false

    for (let i = 1; i < length - 1; i++) {
      if (lastWasSeparator) {
        result += alphanumerics.charAt(Math.floor(Math.random() * alphanumerics.length))
        lastWasSeparator = false
      } else {
        const pickSeparator = Math.random() < 0.15

        if (pickSeparator) {
          result += separators.charAt(Math.floor(Math.random() * separators.length))
          lastWasSeparator = true
        } else {
          result += alphanumerics.charAt(Math.floor(Math.random() * alphanumerics.length))
          lastWasSeparator = false
        }
      }
    }

    result += alphanumerics.charAt(Math.floor(Math.random() * alphanumerics.length))

    return result
  }

  public static random(): UserUsername {
    return UserUsername.fromString(this.randomString())
  }

  public static invalid(): string {
    return 'invalid-username!'
  }
}
