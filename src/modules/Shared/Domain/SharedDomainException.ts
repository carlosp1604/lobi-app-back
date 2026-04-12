import { DomainException, DomainExceptionContext } from '~/src/modules/Exception/Domain/DomainException'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'
import { ValidTranslatableType } from '~/src/modules/Shared/Domain/ValueObject/TranslatableType'
import { ValidTranslatableField } from '~/src/modules/Shared/Domain/ValueObject/TranslatableField'
import { SupportedLocales } from '~/src/modules/Shared/Domain/ValueObject/Locale'

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
  public static invalidPaceId = 'shared_domain_invalid_pace'
  public static invalidSpeedId = 'shared_domain_invalid_speed'
  public static invalidTimeId = 'shared_domain_invalid_time'
  public static invalidDistanceId = 'shared_domain_invalid_distance'
  public static invalidAltitudeId = 'shared_domain_invalid_altitude'
  public static invalidLocationId = 'shared_domain_invalid_location'
  public static invalidUnitId = 'shared_domain_invalid_unit'
  public static invalidMagnitudeValueId = 'shared_domain_invalid_magnitude_value'
  public static invalidMagnitudePrecisionId = 'shared_domain_invalid_magnitude_precision'
  public static cannotDivideMagnitudeByZeroId = 'shared_domain_cannot_divide_magnitude_by_zero'

  private constructor(message: string, id: string, context: DomainExceptionContext = {}) {
    super(message, id, SharedDomainException.name, context)
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
    const supported = SupportedLocales.join(', ')

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

  public static invalidPace(pace: string) {
    const safePaceSample = StringFormatter.formatSafe(pace, 6)

    return new SharedDomainException('Pace must be a valid MM:SS string format or a positive number of seconds', this.invalidPaceId, {
      pace: safePaceSample,
    })
  }

  public static invalidSpeed(speed: string) {
    const safeSpeedSample = StringFormatter.formatSafe(speed, 6)

    return new SharedDomainException('Speed must be a positive number', this.invalidSpeedId, {
      speed: safeSpeedSample,
    })
  }

  public static invalidTime(time: string) {
    const safeTimeSample = StringFormatter.formatSafe(time, 8)

    return new SharedDomainException(
      'Time must be a valid HH:MM:SS or MM:SS string format, or a positive number of seconds',
      this.invalidTimeId,
      {
        time: safeTimeSample,
      },
    )
  }

  public static invalidDistance(distance: string) {
    const safeDistanceSample = StringFormatter.formatSafe(distance, 16)

    return new SharedDomainException('Distance must be a positive number', this.invalidDistanceId, {
      distance: safeDistanceSample,
    })
  }

  public static invalidAltitude(altitude: string) {
    const safeAltitudeSample = StringFormatter.formatSafe(altitude, 16)

    return new SharedDomainException('Altitude must be a number', this.invalidAltitudeId, {
      altitude: safeAltitudeSample,
    })
  }

  public static invalidLocation(lat: string, lng: string) {
    const safeLatitudeSample = StringFormatter.formatSafe(lat, 16)
    const safeLongitudeSample = StringFormatter.formatSafe(lng, 16)

    return new SharedDomainException(
      'Invalid location. Latitude must be between -90 and 90, and longitude between -180 and 180',
      this.invalidLocationId,
      {
        lat: safeLatitudeSample,
        lng: safeLongitudeSample,
      },
    )
  }

  public static invalidUnit(magnitude: string, unit: string, supportedUnits: Array<string>) {
    const safeUnitSample = StringFormatter.formatSafe(unit, 16)

    const supported = supportedUnits.join(', ')

    return new SharedDomainException(`Invalid ${magnitude} unit. Supported units are: [${supported}]`, this.invalidUnitId, {
      unit: safeUnitSample,
      supported: supportedUnits,
      magnitude,
    })
  }

  public static invalidNumericValue(numericValue: number, minPrecision: number, maxPrecision: number, defaultPrecision: number) {
    const safeNumericValueSample = StringFormatter.formatSafe(String(numericValue), 16)

    return new SharedDomainException(`Numeric value ${safeNumericValueSample} is invalid`, this.invalidMagnitudeValueId, {
      numericValue: safeNumericValueSample,
      defaultPrecision,
      maxPrecision,
      minPrecision,
    })
  }

  public static invalidNumericPrecision(precision: number, minPrecision: number, maxPrecision: number, defaultPrecision: number) {
    const safePrecisionValueSample = StringFormatter.formatSafe(String(precision), 8)

    return new SharedDomainException(
      `Precision should be an integer between ${minPrecision} and ${maxPrecision}`,
      this.invalidMagnitudePrecisionId,
      {
        magnitudeValue: safePrecisionValueSample,
        defaultPrecision,
        minPrecision,
        maxPrecision,
      },
    )
  }

  public static cannotDivideMagnitudeByZero() {
    return new SharedDomainException('Cannot divide by zero', this.cannotDivideMagnitudeByZeroId)
  }
}
