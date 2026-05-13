import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'

export interface ParticipationStrategy {
  minCapacity: IntegerNumber
  maxCapacity: IntegerNumber
}
