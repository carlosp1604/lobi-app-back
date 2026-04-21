import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success } from '~/src/modules/Shared/Domain/Result'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/IntegerNumber'

export interface IndividualParticipationProps {
  minPlayers: IntegerNumber
  maxPlayers: IntegerNumber
}

export interface IndividualParticipationInputProps {
  minPlayers?: number
  maxPlayers?: number
}

export class IndividualParticipation extends ValueObject<IndividualParticipationProps> {
  public readonly kind = 'individual'
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

    return this._value.maxPlayers.isEqualTo(vo.value.maxPlayers) && this._value.minPlayers.isEqualTo(vo.value.minPlayers)
  }

  public toString(): string {
    return `Participants: ${this._value.minPlayers.value}-${this._value.maxPlayers.value} players`
  }

  get minCapacity(): number {
    return this._value.minPlayers.value
  }

  get maxCapacity(): number {
    return this._value.maxPlayers.value
  }
}
