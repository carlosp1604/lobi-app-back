import { DomainException } from '~/src/modules/Exception/Domain/DomainException'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'
import { ValidTranslatableType } from '~/src/modules/Shared/Domain/ValueObject/TranslatableType'
import { ValidTranslatableField } from '~/src/modules/Shared/Domain/ValueObject/TranslatableField'
import { SUPPORTED_LOCALES } from '~/src/modules/Shared/Domain/ValueObject/Locale'

export class SharedDomainException extends DomainException {
  public readonly __brand = 'SharedDomainException' as const

  public static invalidIdentifierId = 'shared_domain_invalid_identifier'
  public static invalidEmailAddressId = 'shared_domain_invalid_email_address'
  public static invalidUserIpHashId = 'shared_domain_invalid_user_ip_hash'
  public static invalidSlugId = 'shared_domain_invalid_slug'
  public static invalidResourceUrlId = 'shared_domain_invalid_resource_url'
  public static invalidLocaleId = 'shared_domain_invalid_locale'
  public static invalidTranslatableTypeId = 'shared_domain_invalid_translatable_type'
  public static invalidTranslatableFieldId = 'shared_domain_invalid_translatable_field'

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

  public static invalidResourceUrl(resourceUrl: string) {
    const safeResourceUrlSample = StringFormatter.formatSafe(resourceUrl, 128)
    return new SharedDomainException(`${safeResourceUrlSample} is not a valid url`, this.invalidResourceUrlId)
  }

  public static invalidLocale() {
    const supported = SUPPORTED_LOCALES.join(', ')

    return new SharedDomainException(`Invalid locale. Supported locales are: [${supported}]`, this.invalidLocaleId)
  }

  public static invalidTranslatableType() {
    const validTranslatableTypes = Object.values(ValidTranslatableType)
      .map((translatableType) => `- ${translatableType}`)
      .join('\n')

    const message = ['Invalid translatable type. Must be one of the following:', validTranslatableTypes].join('\n')

    return new SharedDomainException(message, this.invalidTranslatableTypeId)
  }

  public static invalidTranslatableField() {
    const validTranslatableFields = Object.values(ValidTranslatableField)
      .map((translatableField) => `- ${translatableField}`)
      .join('\n')

    const message = ['Invalid translatable field. Must be one of the following:', validTranslatableFields].join('\n')

    return new SharedDomainException(message, this.invalidTranslatableFieldId)
  }
}
