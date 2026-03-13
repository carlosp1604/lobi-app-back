import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'

export class UserAgentMother {
  static valid(): UserAgent {
    return UserAgent.fromProps({
      raw: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LobiTestRunner/1.0',
      browser: { name: 'Chrome', version: '120.0.0.0' },
      os: { name: 'Windows', version: '10.0' },
      device: { type: null, vendor: null, model: null },
    })
  }

  static random(): UserAgent {
    const length = 10 + Math.floor(Math.random() * 50)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/.-_ '
    const fixedString = 'LobiTestRunner/1.0'
    const randomRaw = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)])
      .join('')
      .concat(` ${fixedString}`)

    return UserAgent.fromProps({
      raw: randomRaw,
      browser: { name: 'RandomBrowser', version: '1.0' },
      os: { name: 'RandomOS', version: '1.0' },
      device: { type: null, vendor: null, model: null },
    })
  }

  static unknown(): UserAgent {
    return UserAgent.unknown()
  }
}
