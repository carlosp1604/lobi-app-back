import { UserPassword } from '~/src/modules/Auth/Domain/ValueObject/UserPassword'

export class UserPasswordMother {
  public static readonly INVALID_FORMAT_CASES = [
    '',
    'Short1!',
    'a'.repeat(129),
    'onlylowercase1!',
    'ONLYUPPERCASE1!',
    'NoSpecialChar1',
    'NoNumber!',
    '        ',
  ]

  public static valid(): UserPassword {
    return UserPassword.fromString('Abcdef1!')
  }

  public static randomString(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const specials = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const allChars = uppercase + lowercase + numbers + specials

    let password = ''
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += specials[Math.floor(Math.random() * specials.length)]

    const targetLength = 12
    for (let i = password.length; i < targetLength; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }

    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('')
  }

  public static random(): UserPassword {
    return UserPassword.fromString(this.randomString())
  }

  public static invalid(): string {
    return 'invalid-password'
  }
}
