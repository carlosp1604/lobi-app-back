import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'

export class UserUsernameMother {
  static valid(): UserUsername {
    return UserUsername.fromString('tester')
  }

  static random(): UserUsername {
    const prefix = 'test_'
    const length = 6 + Math.floor(Math.random() * (32 - prefix.length - 5))

    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let rest = ''
    for (let i = 0; i < length; i++) {
      rest += chars[Math.floor(Math.random() * chars.length)]
    }

    return UserUsername.fromString(prefix + rest)
  }
}
