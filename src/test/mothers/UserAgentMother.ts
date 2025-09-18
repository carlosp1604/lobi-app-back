import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'

export class UserAgentMother {
  static valid(): UserAgent {
    const validUA =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 LobiTestRunner/1.0'
    return UserAgent.fromString(validUA)
  }
}
