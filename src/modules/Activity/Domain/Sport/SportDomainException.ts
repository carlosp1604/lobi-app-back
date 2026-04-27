import { DomainException, DomainExceptionContext } from '~/src/modules/Exception/Domain/DomainException'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'

export class SportDomainException extends DomainException {
  public readonly __brand = 'SportDomainException' as const

  public static capabilityValidationFailedId = 'sport_domain_capability_validation_failed'
  public static specValidationFailedId = 'sport_domain_spec_validation_failed'
  public static invalidCapabilityDataId = 'sport_domain_invalid_capability_data'
  public static invalidCapabilityOptionId = 'sport_domain_invalid_capability_option'
  public static invalidSpecDataId = 'sport_domain_invalid_spec_data'
  public static invalidTeamsDataId = 'sport_domain_invalid_teams_data'
  public static invalidParticipantsDataId = 'sport_domain_invalid_participants_data'
  public static invalidSportParticipantsDefinitionId = 'sport_domain_invalid_participants_definition'
  public static activityConfigMismatchForSportId = 'sport_domain_activity_config_mismatch_for_sport'

  private constructor(message: string, id: string, context: DomainExceptionContext = {}) {
    super(message, id, SportDomainException.name, context)
  }

  public static invalidParticipantsDefinition(current: number, min: number, max: number) {
    const safeParticipantsSample = StringFormatter.formatSafe(String(current), 8)

    return new SportDomainException(
      `The default players for a sport must be between ${min} and ${max}`,
      this.invalidSportParticipantsDefinitionId,
      { participants: safeParticipantsSample, min, max },
    )
  }

  public static invalidTeamsDefinition(current: number, min: number, max: number) {
    const safeTeamsSample = StringFormatter.formatSafe(String(current), 8)

    return new SportDomainException(
      `The default teams for a sport must be between ${min} and ${max}`,
      this.invalidSportParticipantsDefinitionId,
      {
        teams: safeTeamsSample,
        min,
        max,
      },
    )
  }

  public static invalidPlayersPerTeamDefinition(current: number, min: number, max: number) {
    const safePlayerPerTeamSample = StringFormatter.formatSafe(String(current), 8)

    return new SportDomainException(
      `The default players per team for a sport must be between ${min} and ${max}`,
      this.invalidSportParticipantsDefinitionId,
      { playersPerTeam: safePlayerPerTeamSample, min, max },
    )
  }

  public static teamsDefinitionMismatch(currentMinPlayer: number, currentTeams: number, currentPlayersPerTeam: number) {
    return new SportDomainException(
      'Invalid definition: The default minimum players does not match the teams definition (teams * players per team)',
      this.invalidSportParticipantsDefinitionId,
      {
        minPlayers: currentMinPlayer,
        teams: currentTeams,
        playersPerSide: currentPlayersPerTeam,
      },
    )
  }

  public static invalidIndividualParticipantsRange(minLimit: number, maxLimit: number, min?: number, max?: number) {
    const safeMaxSample = max ? StringFormatter.formatSafe(String(max), 16) : undefined
    const safeMinSample = min ? StringFormatter.formatSafe(String(min), 16) : undefined

    return new SportDomainException(
      `Min and max players must be an integer value between ${minLimit} and ${maxLimit}. Min players cannot exceed max`,
      this.invalidParticipantsDataId,
      { min: safeMinSample, max: safeMaxSample, minLimit, maxLimit },
    )
  }

  public static invalidTeamsRange(min: number, max: number, minLimit: number, maxLimit: number) {
    return new SportDomainException(
      `Min and max teams must be an integer value between ${minLimit} and ${maxLimit}. Min teams cannot exceed max`,
      this.invalidTeamsDataId,
      { min, max, minLimit, maxLimit },
    )
  }

  public static invalidTeamsMinPlayers(current: number, minRequired: number, realRequired: number) {
    return new SportDomainException(
      `Min players must be an integer value between ${minRequired} and ${realRequired} (minTeams * playersPerTeam)`,
      this.invalidTeamsDataId,
      { current, minRequired, realRequired },
    )
  }

  public static invalidPlayersPerTeamRange(current: number, minLimit: number, maxLimit: number) {
    return new SportDomainException(`Players per team must be between ${minLimit} and ${maxLimit}`, this.invalidTeamsDataId, {
      current,
      minLimit,
      maxLimit,
    })
  }

  public static invalidCapabilityOption(capabilityName: string, option: string, availableOptions: Array<string>) {
    return new SportDomainException(
      `Invalid option for ${capabilityName}. Available options: [${availableOptions.join(', ')}]`,
      this.invalidCapabilityOptionId,
      {
        capability: capabilityName,
        current: option,
        availableOptions,
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

  public static unsupportedCapabilities(sportId: string, unsupportedCapabilities: Array<string>, supportedCapabilities: Array<string>) {
    return new SportDomainException(
      `Capabilities: [${unsupportedCapabilities.join(', ')}] are not supported for selected sport. Supported capabilities are: [${supportedCapabilities.join(', ')}]`,
      this.activityConfigMismatchForSportId,
      {
        sportId,
        unsupportedCapabilities,
        supportedCapabilities,
      },
    )
  }

  public static missingActivitySpec(sportId: string, specName: string) {
    return new SportDomainException(`Missing spec: ${specName} required by selected sport`, this.activityConfigMismatchForSportId, {
      sportId,
      specName,
    })
  }
}
