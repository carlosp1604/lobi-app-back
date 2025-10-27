import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'

export class UserAgentMother {
  static valid(): UserAgent {
    const validUA =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LobiTestRunner/1.0'
    return UserAgent.fromString(validUA)
  }

  static forTesting(): UserAgent {
    return UserAgent.fromString('LobiApp/1.0 (CarlosP at the controls)')
  }

  static random(): UserAgent {
    const length = 10 + Math.floor(Math.random() * 50)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/.-_ '
    const fixedString = 'LobiTestRunner/1.0'
    const ua = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)])
      .join('')
      .concat(` ${fixedString}`)
    return UserAgent.fromString(ua)
  }
}
