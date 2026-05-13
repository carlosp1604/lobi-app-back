import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'

export const PARTICIPATION_LIMITS = {
  MIN_PLAYERS: IntegerNumber.create(2),
  MAX_PLAYERS: IntegerNumber.create(1000),
  MIN_TEAMS: IntegerNumber.create(2),
  MAX_TEAMS: IntegerNumber.create(20),
  MIN_PLAYERS_PER_TEAM: IntegerNumber.create(1),
  MAX_PLAYERS_PER_TEAM: IntegerNumber.create(50),
} as const
