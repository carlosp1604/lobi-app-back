import { Slug } from '~/src/modules/Shared/Domain/ValueObject/Slug'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { SportLevel } from '~/src/modules/Activity/Domain/Sport/SportLevel'
import { ResourceUrl } from '~/src/modules/Shared/Domain/ValueObject/ResourceUrl'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { RawSportSpecs, SportRawModel } from '~/src/modules/Activity/Infrastructure/Entities/sport.entity'
import { TeamParticipantsSpecDefinition } from '~/src/modules/Activity/Domain/Sport/SpecDefinition/TeamParticipantsSpecDefinition'
import { Sport, SportSpecsReconstitutionProps } from '~/src/modules/Activity/Domain/Sport/Sport'
import { IndividualParticipantsSpecDefinition } from '~/src/modules/Activity/Domain/Sport/SpecDefinition/IndividualParticipantsSpecDefinition'

export class SportModelTranslator {
  public static toDomain(raw: SportRawModel, rankingLevels: Array<SportLevel>): Sport {
    return Sport.reconstitute({
      id: Identifier.create(raw.id),
      slug: Slug.fromString(raw.slug),
      imageUrl: raw.image_url ? ResourceUrl.fromString(raw.image_url) : null,
      config: {
        capabilities: raw.config.capabilities as Array<AvailableCapability>,
        specs: SportModelTranslator.translateRawSpecsToDomain(raw.config.specs),
      },
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      rankingLevels,
    })
  }

  private static translateRawSpecsToDomain(specs: RawSportSpecs): SportSpecsReconstitutionProps {
    return {
      individual_participants: specs.individual_participants
        ? IndividualParticipantsSpecDefinition.create(specs.individual_participants)
        : undefined,
      team_participants: specs.team_participants ? TeamParticipantsSpecDefinition.create(specs.team_participants) : undefined,
    }
  }
}
