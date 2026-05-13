import { Slug } from '~/src/modules/Shared/Domain/ValueObject/Slug'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { SportLevel } from '~/src/modules/Activity/Domain/Sport/SportLevel'
import { ResourceUrl } from '~/src/modules/Shared/Domain/ValueObject/ResourceUrl'
import { SpecFactory } from '~/src/modules/Activity/Domain/Config/Spec/SpecFactory'
import { AvailableSpec } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'
import { CapabilityFactory } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityFactory'
import { CapabilityTypeMap } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityRegistry'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { TeamParticipantsSpecInputProps } from '~/src/modules/Activity/Domain/Config/Spec/TeamParticipantsSpec'
import { TeamParticipantsSpecDefinition } from '~/src/modules/Activity/Domain/Sport/SpecDefinition/TeamParticipantsSpecDefinition'
import { IndividualParticipantsSpecDefinition } from '~/src/modules/Activity/Domain/Sport/SpecDefinition/IndividualParticipantsSpecDefinition'
import { IndividualParticipantsSpecInputProps } from '~/src/modules/Activity/Domain/Config/Spec/IndividualParticipantsSpec'
import { SportDomainException, SportDomainExceptionAggregate } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import {
  AVAILABLE_CAPABILITIES,
  AvailableCapability,
  isAvailableCapability,
} from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import {
  ActivityValidatedConfig,
  ValidatedCapabilities,
  ValidatedSpecs,
} from '~/src/modules/Activity/Domain/ValueObject/ActivityValidatedConfig'

export type SportSpecsDefinition = {
  participants: TeamParticipantsSpecDefinition | IndividualParticipantsSpecDefinition
}

export type SportSpecsReconstitutionProps = {
  individual_participants?: IndividualParticipantsSpecDefinition
  team_participants?: TeamParticipantsSpecDefinition
}

export interface SportReconstitutionProps {
  id: Identifier
  slug: Slug
  imageUrl: ResourceUrl | null
  config: {
    specs: SportSpecsReconstitutionProps
    capabilities: Array<AvailableCapability>
  }
  createdAt: Date
  updatedAt: Date
  rankingLevels: Array<SportLevel>
}

export class Sport {
  private constructor(
    public readonly id: Identifier,
    public readonly slug: Slug,
    public readonly imageUrl: ResourceUrl | null,
    private readonly _specs: SportSpecsDefinition,
    private readonly _capabilities: Array<AvailableCapability>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly rankingLevels: Array<SportLevel>,
  ) {}

  public static reconstitute(props: SportReconstitutionProps): Sport {
    const invalidCapabilities = props.config.capabilities.filter((capabilityName) => !isAvailableCapability(capabilityName))

    if (invalidCapabilities.length > 0) {
      throw SportDomainException.capabilitiesMismatch(props.id.value, invalidCapabilities, [...AVAILABLE_CAPABILITIES])
    }

    const participantsSpec = this.processParticipantsSpec(props)

    const specs: SportSpecsDefinition = {
      participants: participantsSpec,
    }

    return new Sport(
      props.id,
      props.slug,
      props.imageUrl,
      specs,
      props.config.capabilities,
      props.createdAt,
      props.updatedAt,
      props.rankingLevels,
    )
  }

  private static processParticipantsSpec(props: SportReconstitutionProps): SportSpecsDefinition['participants'] {
    const { individual_participants, team_participants } = props.config.specs

    if (!individual_participants && !team_participants) {
      throw SportDomainException.participantsSpecDefinitionMismatch(props.id.value)
    }

    if (individual_participants && team_participants) {
      throw SportDomainException.participantsSpecDefinitionMismatch(props.id.value)
    }

    return individual_participants ? individual_participants : team_participants!
  }

  get capabilities(): Array<AvailableCapability> {
    return this._capabilities
  }

  get specs(): SportSpecsDefinition {
    return this._specs
  }

  public createActivityConfig(
    rawCapabilities: Record<AvailableCapability, unknown>,
    rawSpecs: Record<AvailableSpec, unknown>,
    capabilityFactory: CapabilityFactory,
    specFactory: SpecFactory,
  ): Result<ActivityValidatedConfig, SportDomainExceptionAggregate> {
    let errors: Record<string, Array<SportDomainException>> = {}

    const addError = (key: string, error: SportDomainException) => {
      if (!errors[key]) {
        errors[key] = []
      }

      errors[key].push(error)
    }

    const incomingCapabilityNames = Object.keys(rawCapabilities) as Array<AvailableCapability>
    incomingCapabilityNames.forEach((incomingCapability) => {
      if (!this.capabilities.includes(incomingCapability)) {
        addError(
          `capabilities.${incomingCapability}`,
          SportDomainException.unsupportedCapability(this.id.value, incomingCapability, this.capabilities),
        )
      }
    })

    const isTeamSport = this._specs.participants instanceof TeamParticipantsSpecDefinition

    const hasIndividual = !!rawSpecs.individual_participants
    const hasTeam = !!rawSpecs.team_participants

    if (hasIndividual && hasTeam) {
      if (isTeamSport) {
        addError(
          'specs.individual_participants',
          SportDomainException.activityParticipantsSpecConflict(this.id.value, ['team_participants']),
        )
        addError('specs.team_participants', SportDomainException.activityParticipantsSpecConflict(this.id.value, ['team_participants']))
      } else {
        addError(
          'specs.individual_participants',
          SportDomainException.activityParticipantsSpecConflict(this.id.value, ['individual_participants', 'team_participants']),
        )
        addError(
          'specs.team_participants',
          SportDomainException.activityParticipantsSpecConflict(this.id.value, ['individual_participants', 'team_participants']),
        )
      }
    } else if (!hasIndividual && !hasTeam) {
      if (isTeamSport) {
        addError('specs', SportDomainException.missingActivityParticipantsSpec(this.id.value, ['team_participants']))
      } else {
        addError(
          'specs',
          SportDomainException.missingActivityParticipantsSpec(this.id.value, ['individual_participants', 'team_participants']),
        )
      }
    } else if (hasIndividual && isTeamSport) {
      addError(
        'specs.individual_participants',
        SportDomainException.unsupportedSpec(this.id.value, 'individual_participants', ['team_participants']),
      )
      addError('specs', SportDomainException.missingActivityParticipantsSpec(this.id.value, ['team_participants']))
    }

    if (Object.keys(errors).length > 0) {
      return fail(SportDomainExceptionAggregate.invalidActivityConfig(this.id.value, errors))
    }

    errors = {}

    const validatedCapabilities: ValidatedCapabilities = {}

    for (const name of incomingCapabilityNames) {
      const rawProps = rawCapabilities[name] as CapabilityTypeMap[typeof name]['input']

      const result = capabilityFactory.safeCreate(name, rawProps)

      if (!result.success) {
        addError(`capabilities.${name}`, SportDomainException.invalidCapabilityConfiguration(name, result.error.message))
      } else {
        Object.assign(validatedCapabilities, { [name]: result.value })
      }
    }

    if (validatedCapabilities.ranking) {
      const allowedLevelIds = this.rankingLevels.map((level) => level.id)

      const invalidLevels = validatedCapabilities.ranking.levels.filter(
        (levelId) => !allowedLevelIds.find((allowedId) => allowedId.equals(levelId)),
      )

      if (invalidLevels.length) {
        addError(
          'capabilities.ranking',
          SportDomainException.invalidSportLevel(
            this.id.value,
            invalidLevels.map((id) => id.value),
            allowedLevelIds.map((levelId) => levelId.value),
          ),
        )
      }
    }

    const validatedSpecs: ValidatedSpecs = {}

    if (rawSpecs.team_participants) {
      const result = specFactory.safeCreate('team_participants', rawSpecs.team_participants as TeamParticipantsSpecInputProps)

      if (!result.success) {
        addError('specs.team_participants', SportDomainException.invalidSpecConfiguration('team_participants', result.error.message))
      } else {
        validatedSpecs.team_participants = result.value
      }
    } else if (rawSpecs.individual_participants) {
      const result = specFactory.safeCreate(
        'individual_participants',
        rawSpecs.individual_participants as IndividualParticipantsSpecInputProps,
      )

      if (!result.success) {
        addError(
          'specs.individual_participants',
          SportDomainException.invalidSpecConfiguration('individual_participants', result.error.message),
        )
      } else {
        validatedSpecs.individual_participants = result.value
      }
    }

    if (Object.keys(errors).length > 0) {
      return fail(SportDomainExceptionAggregate.invalidActivityConfigData(this.id.value, errors))
    }

    return success(ActivityValidatedConfig.create({ config: { capabilities: validatedCapabilities, specs: validatedSpecs } }))
  }
}
