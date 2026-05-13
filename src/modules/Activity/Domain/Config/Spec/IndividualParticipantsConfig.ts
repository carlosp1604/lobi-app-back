import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'
import { PARTICIPATION_LIMITS } from '~/src/modules/Activity/Domain/ParticipationLimits'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { ParticipationStrategy } from '~/src/modules/Activity/Domain/ParticipationStrategy'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'

export interface IndividualParticipantsConfigProps {
  minPlayers: IntegerNumber
  maxPlayers: IntegerNumber
}

export interface IndividualParticipantsConfigPrimitives {
  minPlayers: number
  maxPlayers: number
}

export interface IndividualParticipantsConfigInputProps {
  minPlayers: number
  maxPlayers?: number
}

export class IndividualParticipantsConfig
  extends ValueObject<IndividualParticipantsConfigProps>
  implements SerializableInterface<IndividualParticipantsConfigPrimitives>, ParticipationStrategy
{
  private __individualParticipantsConfigBrand: void

  public static readonly MIN_PLAYERS_REQUIRED = PARTICIPATION_LIMITS.MIN_PLAYERS
  public static readonly MAX_PLAYERS_ALLOWED = PARTICIPATION_LIMITS.MAX_PLAYERS

  private constructor(props: IndividualParticipantsConfigProps) {
    super(props)
  }

  public static safeCreate(props: IndividualParticipantsConfigInputProps): Result<IndividualParticipantsConfig, SportDomainException> {
    const returnFail = () => {
      return fail(
        SportDomainException.invalidIndividualParticipantsRange(
          this.MIN_PLAYERS_REQUIRED.value,
          this.MAX_PLAYERS_ALLOWED.value,
          props.minPlayers,
          props.maxPlayers,
        ),
      )
    }

    let maxPlayers: IntegerNumber

    const minPlayersResult = IntegerNumber.safeCreate(props.minPlayers)

    if (!minPlayersResult.success) {
      return returnFail()
    }

    const minPlayers = minPlayersResult.value

    if (props.maxPlayers) {
      const integerNumberResult = IntegerNumber.safeCreate(props.maxPlayers)

      if (!integerNumberResult.success) {
        return returnFail()
      }

      maxPlayers = integerNumberResult.value
    } else {
      maxPlayers = this.MAX_PLAYERS_ALLOWED
    }

    if (
      minPlayers.isLessThan(this.MIN_PLAYERS_REQUIRED) ||
      maxPlayers.isGreaterThan(this.MAX_PLAYERS_ALLOWED) ||
      minPlayers.isGreaterThan(maxPlayers)
    ) {
      return returnFail()
    }

    return success(new IndividualParticipantsConfig({ minPlayers, maxPlayers }))
  }

  public static create(props: IndividualParticipantsConfigInputProps): IndividualParticipantsConfig {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static fromPrimitives(primitives: IndividualParticipantsConfigPrimitives): IndividualParticipantsConfig {
    return IndividualParticipantsConfig.create({ minPlayers: primitives.minPlayers, maxPlayers: primitives.maxPlayers })
  }

  public equals(vo?: IndividualParticipantsConfig | null): boolean {
    if (!vo || vo.constructor !== this.constructor) {
      return false
    }

    const { minPlayers, maxPlayers } = this._value

    return maxPlayers.equals(vo._value.maxPlayers) && minPlayers.equals(vo._value.minPlayers)
  }

  public toString(): string {
    const { minPlayers, maxPlayers } = this._value

    return `Participants: ${minPlayers.toString()}-${maxPlayers.toString()} players`
  }

  get minCapacity(): IntegerNumber {
    return this._value.minPlayers
  }

  get maxCapacity(): IntegerNumber {
    return this._value.maxPlayers
  }

  public toPrimitives(): IndividualParticipantsConfigPrimitives {
    const { minPlayers, maxPlayers } = this._value

    return {
      maxPlayers: maxPlayers.toPrimitives(),
      minPlayers: minPlayers.toPrimitives(),
    }
  }
}
