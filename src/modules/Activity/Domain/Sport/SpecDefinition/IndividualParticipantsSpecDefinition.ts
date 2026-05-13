import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { PARTICIPATION_LIMITS } from '~/src/modules/Activity/Domain/ParticipationLimits'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'

export interface IndividualParticipantsSpecDefinitionInputProps {
  defaultMinPlayers: number
  defaultMaxPlayers?: number
}

export interface IndividualParticipantsSpecDefinitionProps {
  defaultMinPlayers: IntegerNumber
  defaultMaxPlayers: IntegerNumber
}

export class IndividualParticipantsSpecDefinition extends ValueObject<IndividualParticipantsSpecDefinitionProps> {
  private __individualParticipantsSpecDefinition: void

  public static readonly MIN_DEFAULT_PLAYERS = PARTICIPATION_LIMITS.MIN_PLAYERS
  public static readonly MAX_DEFAULT_PLAYERS = PARTICIPATION_LIMITS.MAX_PLAYERS

  private constructor(props: IndividualParticipantsSpecDefinitionProps) {
    super(props)
  }

  public static safeCreate(
    props: IndividualParticipantsSpecDefinitionInputProps,
  ): Result<IndividualParticipantsSpecDefinition, SportDomainException> {
    const { defaultMinPlayers, defaultMaxPlayers } = props

    const returnFail = (minValue: number, maxValue: number) => {
      return fail(
        SportDomainException.invalidIndividualPlayersRangeDefinition(
          minValue,
          maxValue,
          this.MIN_DEFAULT_PLAYERS.value,
          this.MAX_DEFAULT_PLAYERS.value,
        ),
      )
    }

    let maxPlayers = this.MAX_DEFAULT_PLAYERS

    if (defaultMaxPlayers !== undefined && defaultMaxPlayers !== null) {
      const defaultMaxPlayersResult = IntegerNumber.safeCreate(defaultMaxPlayers)

      if (!defaultMaxPlayersResult.success) {
        return returnFail(defaultMinPlayers, defaultMaxPlayers)
      }

      maxPlayers = defaultMaxPlayersResult.value

      if (maxPlayers.isLessThan(this.MIN_DEFAULT_PLAYERS) || maxPlayers.isGreaterThan(this.MAX_DEFAULT_PLAYERS)) {
        return returnFail(defaultMinPlayers, maxPlayers.value)
      }
    }

    const defaultMinPlayersResult = IntegerNumber.safeCreate(defaultMinPlayers)

    if (!defaultMinPlayersResult.success) {
      return returnFail(defaultMinPlayers, maxPlayers.value)
    }

    const minPlayers = defaultMinPlayersResult.value

    if (minPlayers.isLessThan(this.MIN_DEFAULT_PLAYERS) || minPlayers.isGreaterThan(this.MAX_DEFAULT_PLAYERS)) {
      return returnFail(minPlayers.value, maxPlayers.value)
    }

    if (minPlayers.isGreaterThan(maxPlayers)) {
      return returnFail(minPlayers.value, maxPlayers.value)
    }

    return success(new IndividualParticipantsSpecDefinition({ defaultMinPlayers: minPlayers, defaultMaxPlayers: maxPlayers }))
  }

  public static create(props: IndividualParticipantsSpecDefinitionInputProps): IndividualParticipantsSpecDefinition {
    const participantsDefinitionResult = this.safeCreate(props)

    if (!participantsDefinitionResult.success) {
      throw participantsDefinitionResult.error
    }

    return participantsDefinitionResult.value
  }

  public equals(vo?: IndividualParticipantsSpecDefinition | null): boolean {
    if (vo === null || vo === undefined) {
      return false
    }

    if (vo.constructor !== this.constructor) {
      return false
    }

    const { defaultMinPlayers } = this._value

    return defaultMinPlayers.equals(vo._value.defaultMinPlayers)
  }

  public toString(): string {
    const { defaultMinPlayers } = this._value

    return `Participants definition: ${defaultMinPlayers.toString()} players`
  }
}
