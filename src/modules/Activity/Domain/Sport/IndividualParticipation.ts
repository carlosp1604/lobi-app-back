import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/IntegerNumber'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'

export interface IndividualParticipationProps {
  minPlayers: IntegerNumber
  maxPlayers: IntegerNumber
}

export interface IndividualParticipationPrimitiveProps {
  minPlayers: number
  maxPlayers: number
}

export interface IndividualParticipationInputProps {
  minPlayers?: number
  maxPlayers?: number
}

export class IndividualParticipation
  extends ValueObject<IndividualParticipationProps>
  implements SerializableInterface<IndividualParticipationPrimitiveProps>
{
  private __individualParticipationBrand: void

  public static readonly MIN_PLAYERS_REQUIRED = IntegerNumber.fromNumber(2)
  public static readonly MAX_PLAYERS_ALLOWED = IntegerNumber.fromNumber(1000)

  private constructor(props: IndividualParticipationProps) {
    super(props)
  }

  public static safeCreate(props: IndividualParticipationInputProps): Result<IndividualParticipation, SportDomainException> {
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

    let minPlayers: IntegerNumber
    let maxPlayers: IntegerNumber

    if (props.minPlayers) {
      const integerNumberResult = IntegerNumber.safeCreate(props.minPlayers)

      if (!integerNumberResult.success) {
        return returnFail()
      }

      minPlayers = integerNumberResult.value
    } else {
      minPlayers = this.MIN_PLAYERS_REQUIRED
    }

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

    return success(new IndividualParticipation({ minPlayers, maxPlayers }))
  }

  public equals(vo?: IndividualParticipation | null): boolean {
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

  public toPrimitives(): IndividualParticipationPrimitiveProps {
    const { minPlayers, maxPlayers } = this._value

    return {
      maxPlayers: maxPlayers.toPrimitives(),
      minPlayers: minPlayers.toPrimitives(),
    }
  }
}
