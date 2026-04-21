import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportRankingSystem } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Ranking/SportRankingSystem'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import {
  CapabilitySchema,
  SportBaseCapability,
  SportCapabilityRawDataValidationError,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SportBaseCapability'

export type RankingCapabilityRawData = {
  id: string
}

export class RankingCapability extends SportBaseCapability<Identifier, RankingCapabilityRawData> {
  public readonly capabilityName = 'ranking'

  constructor(private readonly availableRankings: Array<SportRankingSystem>) {
    super()
  }

  protected validateData(data: unknown): Result<RankingCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<RankingCapabilityRawData>(data, {
      id: 'string',
    })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    return success(typeCheck.value)
  }

  protected performValidation(data: RankingCapabilityRawData): Result<Identifier, SportDomainException> {
    const idResult = Identifier.safeCreate(data.id)

    if (!idResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, idResult.error.message))
    }

    const selectedId = idResult.value

    const exists = this.availableRankings.some((ranking) => ranking.id.equals(selectedId))

    if (!exists) {
      return fail(
        SportDomainException.invalidCapabilityOption(
          this.capabilityName,
          selectedId.value,
          this.availableRankings.map((option) => option.id.value),
        ),
      )
    }

    return success(selectedId)
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

  public translate(vo: Identifier) {
    return {
      kind: 'point',
      type: 'uuid',
      value: vo.value,
    }
  }
}
