import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'

export class UserNameMother {
  public static readonly INVALID_FORMAT_CASES = ['', 'a', '   ', 'a'.repeat(256), 'Pepe!', '1234', 'J\nP']

  static valid(): UserName {
    return UserName.fromString('User Test')
  }

  public static invalid(): string {
    return 'invalid-user-name!'
  }

  public static randomString(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚáéíóúÑñ'
    // eslint-disable-next-line quotes
    const extras = " -'"
    const allPossible = letters + extras

    const length = Math.floor(Math.random() * (50 - 2 + 1)) + 2

    let result = ''

    result += letters.charAt(Math.floor(Math.random() * letters.length))

    for (let i = 1; i < length; i++) {
      result += allPossible.charAt(Math.floor(Math.random() * allPossible.length))
    }

    // eslint-disable-next-line quotes
    if (result.endsWith(' ') || result.endsWith('-') || result.endsWith("'")) {
      result = result.slice(0, -1) + letters.charAt(Math.floor(Math.random() * letters.length))
    }

    return result
  }

  public static random(): UserName {
    return UserName.fromString(this.randomString())
  }
}
