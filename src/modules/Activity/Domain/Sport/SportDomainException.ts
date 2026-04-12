import { DomainException, DomainExceptionContext } from '~/src/modules/Exception/Domain/DomainException'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'
import { SupportedSportSlug, ValidSportModality } from '~/src/modules/Activity/Domain/Sport/SportRegistry/SportRegistry'

export class SportDomainException extends DomainException {
  public readonly __brand = 'SportDomainException' as const

  public static invalidSportId = 'sport_domain_invalid_sport'
  public static invalidSportModalityId = 'sport_domain_invalid_sport_modality'
  public static incompatibleConfigurationId = 'sport_domain_incompatible_configuration'
  public static invalidPlayersNumberId = 'sport_domain_invalid_players_number'
  public static invalidSportConfigurationId = 'sport_domain_invalid_sport_configuration'

  public static invalidCapabilityDataTypeId = 'sport_domain_invalid_capability_data_type'
  public static capabilityValidationFailedId = 'sport_domain_capability_validation_failed'
  public static specValidationFailedId = 'sport_domain_spec_validation_failed'

  public static invalidCapabilityDataId = 'sport_domain_invalid_capability_data'
  public static invalidSpecDataId = 'sport_domain_invalid_spec_data'

  private constructor(message: string, id: string, context: DomainExceptionContext = {}) {
    super(message, id, SportDomainException.name, context)
  }

  public static invalidSport(sport: string) {
    const safeSportSample = StringFormatter.formatSafe(sport, 36)
    const supportedSports = Object.values(SupportedSportSlug)
      .map((sport) => `- ${sport}`)
      .join('\n')

    const message = ['Invalid sport. Must be one of the following:', supportedSports].join('\n')

    return new SportDomainException(message, this.invalidSportId, {
      sport: safeSportSample,
    })
  }

  public static invalidModality(modality: string) {
    const safeModalitySample = StringFormatter.formatSafe(modality, 16)
    const validSportModalities = Object.values(ValidSportModality)
      .map((sportModality) => `- ${sportModality}`)
      .join('\n')

    const message = ['Invalid sport modality. Must be one of the following:', validSportModalities].join('\n')

    return new SportDomainException(message, this.invalidSportModalityId, {
      modality: safeModalitySample,
    })
  }

  public static incompatibleConfiguration(sport: SupportedSportSlug, modality: ValidSportModality) {
    return new SportDomainException(
      'Invalid sport configuration. Sport and modality are not compatible',
      this.incompatibleConfigurationId,
      {
        sport,
        modality,
      },
    )
  }

  public static invalidCapabilityDataType(capabilityName: string, field: string, expected: string) {
    return new SportDomainException(
      `Invalid data type for ${field} in capability ${capabilityName}. Expected: ${expected}`,
      this.invalidCapabilityDataTypeId,
      {
        capability: capabilityName,
        field,
        expected,
      },
    )
  }

  public static capabilityValidationFailed(capabilityName: string, reason: string) {
    return new SportDomainException(
      `Validation failed for capability ${capabilityName}: ${reason}`,
      this.capabilityValidationFailedId,
      {
        capability: capabilityName,
        reason,
      },
    )
  }

  public static specValidationFailed(specName: string, reason: string) {
    return new SportDomainException(`Validation failed for spec ${specName}: ${reason}`, this.specValidationFailedId, {
      spec: specName,
      reason,
    })
  }

  public static invalidCapabilityData(capabilityName: string, errors: Array<string>) {
    return new SportDomainException(`Invalid capability data. Errors:\n${errors.join('\n')}`, this.invalidCapabilityDataId, {
      capability: capabilityName,
      errors,
    })
  }

  public static invalidSpecData(specName: string, errors: Array<string>) {
    return new SportDomainException(`Invalid spec data. Errors:\n${errors.join('\n')}`, this.invalidSpecDataId, {
      spec: specName,
      errors,
    })
  }
}
