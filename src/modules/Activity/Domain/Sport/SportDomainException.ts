import { DomainException, DomainExceptionContext } from '~/src/modules/Exception/Domain/DomainException'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'

export class SportDomainExceptionAggregate {
  public readonly __brand = 'SportDomainExceptionAggregate' as const

  public static readonly invalidActivityConfigId = 'sport_domain_aggregate_invalid_activity_config'
  public static readonly invalidActivityConfigDataId = 'sport_domain_aggregate_invalid_activity_config_data'

  private constructor(
    public readonly message: string,
    public readonly id: string,
    public readonly details?: Record<string, Array<SportDomainException>>,
  ) {}

  public static invalidActivityConfig(
    sportId: string,
    details: Record<string, Array<SportDomainException>>,
  ): SportDomainExceptionAggregate {
    return new SportDomainExceptionAggregate(
      `Missing/Unsupported data found while processing activity config from sport with ID ${sportId}`,
      this.invalidActivityConfigId,
      details,
    )
  }

  public static invalidActivityConfigData(
    sportId: string,
    details: Record<string, Array<SportDomainException>>,
  ): SportDomainExceptionAggregate {
    return new SportDomainExceptionAggregate(
      `Invalid data found while creating activity config from sport with ID ${sportId}`,
      this.invalidActivityConfigDataId,
      details,
    )
  }
}

export class SportDomainException extends DomainException {
  public readonly __brand = 'SportDomainException' as const

  public static readonly invalidTeamParticipantsConfigId = 'sport_domain_invalid_teams_participants_config'
  public static readonly invalidIndividualParticipantsConfigId = 'sport_domain_invalid_individual_participants_config'
  public static readonly invalidTeamParticipantsSpecDefinitionId = 'sport_domain_invalid_team_participants_spec_definition'
  public static readonly invalidIndividualParticipantsSpecDefinitionId = 'sport_domain_invalid_individual_participants_spec_definition'
  public static readonly activityConfigMismatchForSportId = 'sport_domain_activity_config_mismatch_for_sport'
  public static readonly invalidSportConfigurationId = 'sport_domain_invalid_sport_configuration'
  public static readonly unsupportedCapabilityId = 'sport_domain_unsupported_capability'
  public static readonly unsupportedSpecId = 'sport_domain_unsupported_spec'
  public static readonly missingActivityParticipantsSpecId = 'sport_domain_missing_activity_participants_spec'
  public static readonly activityParticipantsSpecConflictId = 'sport_domain_activity_participants_spec_conflict'
  public static readonly invalidCapabilityConfigurationId = 'sport_domain_invalid_capability_configuration'
  public static readonly invalidSpecConfigurationId = 'sport_domain_invalid_spec_configuration'
  public static readonly invalidSportLevelId = 'sport_domain_invalid_sport_level'

  private constructor(message: string, id: string, context: DomainExceptionContext = {}) {
    super(message, id, SportDomainException.name, context)
  }

  public static capabilitiesMismatch(sportId: string, invalidCapabilities: Array<string>, availableCapabilities: Array<string>) {
    return new SportDomainException(
      `Invalid capabilities found in sport configuration. Available capabilities are: [${availableCapabilities.join(', ')}]`,
      this.invalidSportConfigurationId,
      { sportId, invalidCapabilities, availableCapabilities },
    )
  }

  public static participantsSpecDefinitionMismatch(sportId: string): SportDomainException {
    return new SportDomainException(
      // eslint-disable-next-line quotes
      "A sport requires exactly one participants definition: either 'individual_participants' or 'team_participants', but not both",
      this.invalidSportConfigurationId,
      { sportId },
    )
  }

  public static invalidIndividualPlayersRangeDefinition(currentMin: number, currentMax: number, min: number, max: number) {
    const safeCurrentMinSample = StringFormatter.formatSafe(String(currentMin), 8)
    const safeCurrentMaxSample = StringFormatter.formatSafe(String(currentMax), 8)

    return new SportDomainException(
      `Invalid players number. Min and max players must be an integer between ${min} and ${max}`,
      this.invalidTeamParticipantsSpecDefinitionId,
      { maxParticipants: safeCurrentMaxSample, minParticipants: safeCurrentMinSample, min, max },
    )
  }

  public static invalidTeamDefaultPlayersDefinition(current: number, min: number, max: number) {
    const safeParticipantsSample = StringFormatter.formatSafe(String(current), 8)

    return new SportDomainException(
      `Invalid players number. The default players for a team sport must be an integer number between ${min} and ${max}`,
      this.invalidTeamParticipantsSpecDefinitionId,
      { participants: safeParticipantsSample, min, max },
    )
  }

  public static invalidTeamsRangeDefinition(current: number, min: number, max: number) {
    const safeTeamsSample = StringFormatter.formatSafe(String(current), 8)

    return new SportDomainException(
      `Invalid teams number. The default teams for a sport must be an integer number between ${min} and ${max}`,
      this.invalidTeamParticipantsSpecDefinitionId,
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
      `The default players per team for a sport must be an integer number between ${min} and ${max}`,
      this.invalidTeamParticipantsSpecDefinitionId,
      { playersPerTeam: safePlayerPerTeamSample, min, max },
    )
  }

  public static teamsDefinitionMismatch(currentMinPlayer: number, currentTeams: number, currentPlayersPerTeam: number) {
    return new SportDomainException(
      'Invalid definition: The default minimum players does not match the teams definition (teams * players per team)',
      this.invalidTeamParticipantsSpecDefinitionId,
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
      this.invalidIndividualParticipantsConfigId,
      { min: safeMinSample, max: safeMaxSample, minLimit, maxLimit },
    )
  }

  public static invalidTeamsRange(min: number, max: number, minLimit: number, maxLimit: number) {
    return new SportDomainException(
      `Min and max teams must be an integer value between ${minLimit} and ${maxLimit}. Min teams cannot exceed max`,
      this.invalidTeamParticipantsConfigId,
      { min, max, minLimit, maxLimit },
    )
  }

  public static invalidTeamsMinPlayers(current: number, minRequired: number, realRequired: number) {
    return new SportDomainException(
      `Min players must be an integer value between ${minRequired} and ${realRequired} (minTeams * playersPerTeam)`,
      this.invalidTeamParticipantsConfigId,
      { current, minRequired, realRequired },
    )
  }

  public static invalidPlayersPerTeamRange(current: number, minLimit: number, maxLimit: number) {
    return new SportDomainException(
      `Players per team must be between ${minLimit} and ${maxLimit}`,
      this.invalidTeamParticipantsConfigId,
      {
        current,
        minLimit,
        maxLimit,
      },
    )
  }

  public static unsupportedCapability(sportId: string, unsupportedCapability: string, supportedCapabilities: Array<string>) {
    const safeUnsupportedCapabilitySample = StringFormatter.formatSafe(unsupportedCapability, 32)
    return new SportDomainException(
      `Unsupported capability: '${safeUnsupportedCapabilitySample}'. Available capabilities: [${supportedCapabilities.join(', ')}].`,
      this.unsupportedCapabilityId,
      {
        sportId,
        unsupportedCapability,
        supportedCapabilities,
      },
    )
  }

  public static unsupportedSpec(sportId: string, unsupportedSpec: string, supportedSpecs: Array<string>) {
    const safeUnsupportedSpecSample = StringFormatter.formatSafe(unsupportedSpec, 32)
    return new SportDomainException(
      `Unsupported spec: '${safeUnsupportedSpecSample}'. Available specs: [${supportedSpecs.join(', ')}].`,
      this.unsupportedSpecId,
      {
        sportId,
        unsupportedSpec,
        supportedSpecs,
      },
    )
  }

  public static missingActivityParticipantsSpec(sportId: string, allowedSpecs: Array<string>) {
    const optionsText = allowedSpecs.length > 1 ? `one of [${allowedSpecs.join(', ')}]` : `'${allowedSpecs[0]}'`

    return new SportDomainException(`Missing required spec. You must provide ${optionsText}.`, this.missingActivityParticipantsSpecId, {
      sportId,
      allowedSpecs,
    })
  }

  public static activityParticipantsSpecConflict(sportId: string, allowedSpecs: Array<string>) {
    return new SportDomainException(
      `Conflicting participants specs provided. Exactly one is required. Allowed options: [${allowedSpecs.join(', ')}].`,
      this.activityParticipantsSpecConflictId,
      {
        sportId,
        allowedSpecs,
      },
    )
  }

  public static invalidCapabilityConfiguration(capabilityName: string, reason: string) {
    return new SportDomainException(
      `Invalid '${capabilityName}' capability configuration. Reason: ${reason}`,
      this.invalidCapabilityConfigurationId,
      {
        capability: capabilityName,
      },
    )
  }

  public static invalidSpecConfiguration(specName: string, reason: string) {
    return new SportDomainException(`Invalid '${specName}' spec configuration. Reason: ${reason}`, this.invalidSpecConfigurationId, {
      spec: specName,
      reason,
    })
  }

  public static invalidSportLevel(sportId: string, levelIds: Array<string>, supportedLevels: Array<string>) {
    return new SportDomainException(
      `Invalid sport level(s): [${levelIds.join(', ')}]. Allowed levels: [${supportedLevels.join(', ')}]`,
      this.invalidSportLevelId,
      {
        sportId,
        levelIds,
        supportedLevels,
      },
    )
  }
}
