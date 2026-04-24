import { Slug } from '~/src/modules/Shared/Domain/ValueObject/Slug'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ResourceUrl } from '~/src/modules/Shared/Domain/ValueObject/ResourceUrl'
import { SportParticipantsDefinition } from '~/src/modules/Activity/Domain/Sport/SportParticipantsDefinition'
import { RawSportSpecs, SportRawModel } from '~/src/modules/Activity/Infrastructure/Entities/sport.entity'
import { AvailableCapability, isAvailableCapability, Sport, SportSpecsDefinition } from '~/src/modules/Activity/Domain/Sport/Sport'

export class SportModelTranslator {
  public static toDomain(raw: SportRawModel): Sport {
    const invalidCapabilities = raw.config.capabilities.filter((capability) => !isAvailableCapability(capability))

    if (invalidCapabilities.length > 0) {
      throw Error(`Invalid capabilities found in sport with ID ${raw.id}: [${invalidCapabilities.join(', ')}]`)
    }

    return Sport.reconstitute({
      id: Identifier.fromString(raw.id),
      slug: Slug.fromString(raw.slug),
      imageUrl: raw.image_url ? ResourceUrl.fromString(raw.image_url) : null,
      config: {
        capabilities: raw.config.capabilities as Array<AvailableCapability>,
        specs: SportModelTranslator.translateRawSpecsToDomain(raw.config.specs),
      },
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    })
  }

  private static translateRawSpecsToDomain(specs: RawSportSpecs): SportSpecsDefinition {
    const participantsDefinition = specs.participants

    return {
      participants: SportParticipantsDefinition.fromProps(participantsDefinition),
    }
  }
}
