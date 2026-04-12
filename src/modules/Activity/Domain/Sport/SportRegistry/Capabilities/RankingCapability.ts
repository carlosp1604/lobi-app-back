import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { RankingLevel } from '~/src/modules/Activity/Domain/Sport/Ranking/RankingLevel'
import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import {
  SportBaseCapability,
  SportCapabilityType,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SportBaseCapability'

export type RankingCapabilityRawData = {
  levelId: string
}

export class RankingCapability implements SportBaseCapability<RankingLevel> {
  public readonly flagName = 'allowRanking'
  public readonly capabilityName = 'ranking'

  constructor(private readonly availableLevels: Array<RankingLevel>) {}

  public validate(rawValue: unknown): Result<RankingLevel, SportDomainException> {
    const typeCheck = TypeValidator.validate<RankingCapabilityRawData>(rawValue || {}, { levelId: 'string' })

    if (!typeCheck.success) {
      return fail(SportDomainException.invalidCapabilityData(this.capabilityName, typeCheck.error))
    }

    const { levelId: rawLevelId } = typeCheck.value

    const levelIdResult = Identifier.safeCreate(rawLevelId)

    if (!levelIdResult.success) {
      // TODO:
      return fail(SportDomainException.invalidCapabilityData(this.capabilityName, [levelIdResult.error.message]))
    }

    const levelId = levelIdResult.value

    const selectedLevel = this.availableLevels.find((level) => level.id.equals(levelId))

    if (!selectedLevel) {
      // TODO:
      return fail(
        SportDomainException.capabilityValidationFailed(
          this.capabilityName,
          `The ranking level with ID '${levelId.value}' is not valid or does not exist.`,
        ),
      )
    }

    return success(selectedLevel)
  }

  public toDTO(): Record<string, unknown> {
    return {
      type: SportCapabilityType.CHOICE,
      levels: this.availableLevels.map((level) => ({
        id: level.id,
        slug: level.slug,
        imageUrl: level.imageUrl ? level.imageUrl.value : null,
        translations: level.translations,
      })),
    }
  }
}
