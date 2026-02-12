export class UserPasswordMother {
  static valid(): string {
    return 'SecurePass123!'
  }

  static random(): string {
    const randomSuffix = Math.floor(Math.random() * 1000)

    return `TestPass${randomSuffix}!`
  }
}
