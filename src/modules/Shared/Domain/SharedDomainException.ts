import { DomainException } from '~/src/modules/Exception/Domain/DomainException'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'

export class SharedDomainException extends DomainException {
  public readonly __brand = 'SharedDomainException' as const

  public static invalidIdentifierId = 'shared_domain_invalid_identifier'
  public static invalidEmailAddressId = 'shared_domain_invalid_email_address'
  public static invalidUserIpHashId = 'shared_domain_invalid_user_ip_hash'
  public static invalidSlugId = 'shared_domain_invalid_slug'

  private constructor(message: string, id: string) {
    super(message, id, SharedDomainException.name)
  }

  public static invalidIdentifier(identifier: string) {
    const safeIdentifierSample = StringFormatter.formatSafe(identifier, 36)
    return new SharedDomainException(`${safeIdentifierSample} is not a valid Identifier`, this.invalidIdentifierId)
  }

  public static invalidEmailAddress(emailAddress: string) {
    const safeEmailAddressSample = StringFormatter.formatSafe(emailAddress, 255)
    return new SharedDomainException(`${safeEmailAddressSample} is not a valid Email Address`, this.invalidEmailAddressId)
  }

  public static invalidUserIpHash() {
    return new SharedDomainException('Invalid User IP format', this.invalidUserIpHashId)
  }

  public static invalidSlug(slug: string) {
    const safeSlugSample = StringFormatter.formatSafe(slug, 36)
    return new SharedDomainException(`${safeSlugSample} is not a valid slug`, this.invalidSlugId)
  }
}
