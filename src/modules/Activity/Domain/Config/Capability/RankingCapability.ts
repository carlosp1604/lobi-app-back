import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { CapabilityInterface } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'

export type RankingCapabilityInputProps = { ids: Array<string> }
export type RankingCapabilityPrimitives = { ids: Array<string> }
export type RankingCapabilityProps = Array<Identifier>

export class RankingCapability extends ValueObject<RankingCapabilityProps> implements CapabilityInterface<RankingCapabilityPrimitives> {
  public static readonly capabilityName = 'ranking'
  public static readonly maxSupportedLevels = 10
  public static readonly minSupportedLevels = 1

  private constructor(levels: RankingCapabilityProps) {
    super(levels)
  }

  public static safeCreate(props: RankingCapabilityInputProps): Result<RankingCapability, ActivityDomainException> {
    const rawIdentifiers = Array.from(new Set(props.ids))

    if (rawIdentifiers.length < this.minSupportedLevels || rawIdentifiers.length > this.maxSupportedLevels) {
      return fail(
        ActivityDomainException.invalidCapabilityConfiguration(
          this.capabilityName,
          `Ranking allows to specify between ${this.minSupportedLevels} and ${this.maxSupportedLevels} levels `,
        ),
      )
    }

    const selectedIds: Array<Identifier> = []

    for (const rawId of rawIdentifiers) {
      const idResult = Identifier.safeCreate(rawId)

      if (!idResult.success) {
        return fail(ActivityDomainException.invalidCapabilityConfiguration(this.capabilityName, idResult.error.message))
      }

      const selectedId = idResult.value

      selectedIds.push(selectedId)
    }

    return success(new RankingCapability(selectedIds))
  }

  public static create(props: RankingCapabilityInputProps): RankingCapability {
    const createResult = this.safeCreate(props)

    if (!createResult.success) {
      throw createResult.error
    }

    return createResult.value
  }

  public static fromPrimitives(primitives: RankingCapabilityPrimitives): RankingCapability {
    return new RankingCapability(primitives.ids.map((id) => Identifier.create(id)))
  }

  public toPrimitives(): RankingCapabilityPrimitives {
    return {
      ids: this._value.map((levelId) => levelId.toPrimitives()),
    }
  }

  public equals(vo?: RankingCapability | null): boolean {
    if (vo === null || vo === undefined) {
      return false
    }

    if (vo.constructor !== this.constructor) {
      return false
    }

    if (this.value.length !== vo.value.length) {
      return false
    }

    const thisSortedStrings = this.value.map((id) => id.value).sort()
    const otherSortedStrings = vo.value.map((id) => id.value).sort()

    return thisSortedStrings.join(',') === otherSortedStrings.join(',')
  }

  public toString(): string {
    return `[${this._value.map((id) => id.toString()).join(', ')}]`
  }

  public get levels(): Array<Identifier> {
    return this._value
  }
}
