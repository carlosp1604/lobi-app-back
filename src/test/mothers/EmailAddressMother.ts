import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'

export abstract class EmailAddressMother {
  public static readonly INVALID_FORMAT_CASES = [
    '',
    'no-at-symbol',
    '@example.com',
    'user@',
    'user@example',
    'user example@example.com',
    'user@\nexample.com',
    `${'a'.repeat(65)}@example.com`,
    `u${'a'.repeat(310)}@example.com`,
  ]

  protected static validString(): string {
    return UserEmail.fromString('test@example.com').toString()
  }

  protected static randomValidString(): string {
    const localPart = this.randomString()
    const domain = this.randomDomain()
    return UserEmail.fromString(`${localPart}@${domain}`).toString()
  }

  private static randomString(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  private static randomDomain(): string {
    const domains = ['example.com', 'mail.com', 'test.org', 'domain.net', 'my-site.io']
    return domains[Math.floor(Math.random() * domains.length)]
  }

  protected static invalidValue(): string {
    return 'not-a-valid-email-address'
  }
}
