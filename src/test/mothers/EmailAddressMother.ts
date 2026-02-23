import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'

export class EmailAddressMother {
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

  static valid(): EmailAddress {
    return EmailAddress.fromString('test@example.com')
  }

  static random(): EmailAddress {
    return EmailAddress.fromString(this.randomString())
  }

  static randomString(): string {
    const localPart = this.randomLocal()
    const domain = this.randomDomain()
    return `${localPart}@${domain}`
  }

  static invalid(): string {
    return 'not-a-valid-email-address'
  }

  private static randomLocal(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  private static randomDomain(): string {
    const domains = ['example.com', 'mail.com', 'test.org', 'domain.net', 'my-site.io']
    return domains[Math.floor(Math.random() * domains.length)]
  }
}
