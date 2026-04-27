import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportRankingSystem } from '~/src/modules/Activity/Domain/Sport/Ranking/SportRankingSystem'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { RankingOptionChoiceApplicationDto } from '~/src/modules/Activity/Application/Dto/RankingOptionChoiceApplicationDto'
import { RankingOptionChoiceApplicationDtoTranslator } from '~/src/modules/Activity/Application/Translator/RankingOptionChoiceApplicationDtoTranslator'
import {
  CapabilitySchema,
  SportBaseCapability,
  SportCapabilityRawDataValidationError,
} from '~/src/modules/Activity/Application/Sport/Capabilities/SportBaseCapability'

export type RankingCapabilityRawData = {
  ids: Array<string>
}

export class RankingCapability extends SportBaseCapability<Array<SportRankingSystem>, RankingCapabilityRawData> {
  public readonly capabilityName = 'ranking'

  constructor(private readonly availableRankings: Array<SportRankingSystem>) {
    super()
  }

  protected validateData(data: unknown): Result<RankingCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<RankingCapabilityRawData>(data, {
      ids: { type: 'array', items: { type: 'string' } },
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    return success(typeCheck.value)
  }

  protected performValidation(data: RankingCapabilityRawData): Result<Array<SportRankingSystem>, SportDomainException> {
    const rawIdentifiers = Array.from(new Set(data.ids))

    const selectedOptions: Array<SportRankingSystem> = []

    for (const rawId of rawIdentifiers) {
      const idResult = Identifier.safeCreate(rawId)

      if (!idResult.success) {
        return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, idResult.error.message))
      }

      const selectedId = idResult.value

      const option = this.availableRankings.find((ranking) => ranking.id.equals(selectedId))

      if (!option) {
        return fail(
          SportDomainException.invalidCapabilityOption(
            this.capabilityName,
            selectedId.value,
            this.availableRankings.map((option) => option.id.value),
          ),
        )
      }

      selectedOptions.push(option)
    }

    return success(selectedOptions)
  }

  public getSchema(): CapabilitySchema {
    return {
      name: this.capabilityName,
      data: {
        type: 'choice',
        options: this.availableRankings.map((ranking) => ({
          id: ranking.id.value,
          slug: ranking.slug.value,
          order: ranking.order,
          imageUrl: ranking.imageUrl?.value ?? null,
        })),
      },
    }
  }

  public toPrimitives(values: Array<SportRankingSystem>): Array<string> {
    return values.map((ranking) => ranking.id.toPrimitives())
  }

  public translate(values: Array<SportRankingSystem>): RankingOptionChoiceApplicationDto {
    return new RankingOptionChoiceApplicationDtoTranslator().translate(values)
  }
}
