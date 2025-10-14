import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'

export class UserEmailMother {
  static valid(): UserEmail {
    return UserEmail.fromString('test@example.com')
  }

  static random(): UserEmail {
    const localPart = this.randomString()
    const domain = this.randomDomain()
    return UserEmail.fromString(`${localPart}@${domain}`)
  }

  private static randomString(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  private static randomDomain(): string {
    const domains = ['example.com', 'mail.com', 'test.org', 'domain.net', 'my-site.io']
    return domains[Math.floor(Math.random() * domains.length)]
  }
}
