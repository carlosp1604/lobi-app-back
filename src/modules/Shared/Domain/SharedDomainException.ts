import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'
import { SupportedLocales } from '~/src/modules/Shared/Domain/ValueObject/Locale'
import { DomainException, DomainExceptionContext } from '~/src/modules/Exception/Domain/DomainException'

export class SharedDomainException extends DomainException {
  public readonly __brand = 'SharedDomainException' as const

  public static invalidIdentifierId = 'shared_domain_invalid_identifier'
  public static invalidEmailAddressId = 'shared_domain_invalid_email_address'
  public static invalidUserIpHashId = 'shared_domain_invalid_user_ip_hash'
  public static invalidSlugId = 'shared_domain_invalid_slug'
  public static invalidResourceUrlId = 'shared_domain_invalid_resource_url'
  public static invalidLocaleId = 'shared_domain_invalid_locale'
  public static invalidPaceId = 'shared_domain_invalid_pace'
  public static invalidSpeedId = 'shared_domain_invalid_speed'
  public static invalidDurationId = 'shared_domain_invalid_duration'
  public static invalidDistanceId = 'shared_domain_invalid_distance'
  public static invalidAltitudeId = 'shared_domain_invalid_altitude'
  public static invalidLocationId = 'shared_domain_invalid_location'
  public static invalidRPEId = 'shared_domain_invalid_rpe'
  public static invalidUnitId = 'shared_domain_invalid_unit'
  public static invalidMagnitudeRangeId = 'shared_domain_invalid_magnitude_range'
  public static invalidBoundedNumberId = 'shared_domain_invalid_bounded_number'
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

  public static invalidPace(pace: string, min: number, max: number) {
    const safePaceSample = StringFormatter.formatSafe(pace, 6)

    return new SharedDomainException(`Pace must be a number of seconds between ${min} and ${max}`, this.invalidPaceId, {
      pace: safePaceSample,
      min,
      max,
    })
  }

  public static invalidSpeed(speed: string, min: number, max: number) {
    const safeSpeedSample = StringFormatter.formatSafe(speed, 6)

    return new SharedDomainException(`Speed must be a number between ${min} and ${max}`, this.invalidSpeedId, {
      speed: safeSpeedSample,
      min,
      max,
    })
  }

  public static invalidDuration(duration: string, min: number, max: number) {
    const safeDurationSample = StringFormatter.formatSafe(duration, 8)

    return new SharedDomainException(`Duration must be a number of seconds between ${min} and ${max}`, this.invalidDurationId, {
      duration: safeDurationSample,
      min,
      max,
    })
  }

  public static invalidDistance(distance: string, min: number, max: number) {
    const safeDistanceSample = StringFormatter.formatSafe(distance, 16)

    return new SharedDomainException(`Distance must be a positive number between ${min} and ${max}`, this.invalidDistanceId, {
      distance: safeDistanceSample,
      min,
      max,
    })
  }

  public static invalidAltitude(altitude: string, min: number, max: number) {
    const safeAltitudeSample = StringFormatter.formatSafe(altitude, 16)

    return new SharedDomainException(`Altitude must be a number between ${min} and ${max}`, this.invalidAltitudeId, {
      altitude: safeAltitudeSample,
      min,
      max,
    })
  }

  public static invalidLocation(lat: string, lng: string) {
    const safeLatitudeSample = StringFormatter.formatSafe(lat, 16)
    const safeLongitudeSample = StringFormatter.formatSafe(lng, 16)

    return new SharedDomainException(
      'Latitude must be between -90 and 90, and longitude between -180 and 180',
      this.invalidLocationId,
      {
        lat: safeLatitudeSample,
        lng: safeLongitudeSample,
      },
    )
  }

  public static invalidRPE(value: string, min: string, max: string) {
    const safeRPE = StringFormatter.formatSafe(value, 16)

    return new SharedDomainException(`RPE must be a number between ${min} and ${max}`, this.invalidRPEId, {
      rpe: safeRPE,
      min,
      max,
    })
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

  public static invalidBoundedNumber(value: string, min: number, max: number, precision: number) {
    const safeNumberSample = StringFormatter.formatSafe(String(value), 16)

    return new SharedDomainException(
      `${safeNumberSample} is not a valid BoundedNumber. It must be a number between ${min} and ${max}.`,
      this.invalidBoundedNumberId,
      {
        boundedNumber: safeNumberSample,
        precision,
        minValue: min,
        maxValue: max,
      },
    )
  }

  public static invalidMagnitudeRange(start: string, end: string) {
    return new SharedDomainException(`Start value ${start} cannot be greater than end value ${end}`, this.invalidMagnitudeRangeId, {
      start,
      end,
    })
  }

  public static cannotDivideByZero() {
    return new SharedDomainException('Cannot divide by zero', this.cannotDivideMagnitudeByZeroId)
  }
}
