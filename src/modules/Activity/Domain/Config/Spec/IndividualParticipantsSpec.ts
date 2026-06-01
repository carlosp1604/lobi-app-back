import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SpecInterface } from '~/src/modules/Activity/Domain/Config/Spec/SpecInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import {
  IndividualParticipantsConfig,
  IndividualParticipantsConfigInputProps,
  IndividualParticipantsConfigPrimitives,
} from '~/src/modules/Activity/Domain/Config/Spec/IndividualParticipantsConfig'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'

export type IndividualParticipantsSpecInputProps = IndividualParticipantsConfigInputProps
export type IndividualParticipantsSpecPrimitives = IndividualParticipantsConfigPrimitives

export class IndividualParticipantsSpec
  extends ValueObject<IndividualParticipantsConfig>
  implements SpecInterface<IndividualParticipantsSpecPrimitives>
{
  public static readonly specName = 'individual_participants'
  public static readonly maxPlayers = IndividualParticipantsConfig.MAX_PLAYERS_ALLOWED
  public static readonly minPlayers = IndividualParticipantsConfig.MIN_PLAYERS_REQUIRED

  private constructor(individualParticipation: IndividualParticipantsConfig) {
    super(individualParticipation)
  }

  public static safeCreate(props: IndividualParticipantsSpecInputProps): Result<IndividualParticipantsSpec, ActivityDomainException> {
    const individualParticipationResult = IndividualParticipantsConfig.safeCreate(props)

    if (!individualParticipationResult.success) {
      return fail(ActivityDomainException.invalidSpecConfiguration(this.specName, individualParticipationResult.error.message))
    }

    return success(new IndividualParticipantsSpec(individualParticipationResult.value))
  }

  public static create(props: IndividualParticipantsSpecInputProps): IndividualParticipantsSpec {
    const createResult = this.safeCreate(props)

    if (!createResult.success) {
      throw createResult.error
    }

    return createResult.value
  }

  public static fromPrimitives(primitives: IndividualParticipantsSpecPrimitives): IndividualParticipantsSpec {
    return new IndividualParticipantsSpec(IndividualParticipantsConfig.fromPrimitives(primitives))
  }

  public toPrimitives(): IndividualParticipantsSpecPrimitives {
    return this._value.toPrimitives()
  }

  public equals(vo?: IndividualParticipantsSpec | null): boolean {
    if (vo === null || vo === undefined) {
      return false
    }

    if (vo.constructor !== this.constructor) {
      return false
    }

    return this._value.equals(vo._value)
  }
}
