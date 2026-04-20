import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Visitor/MeasurableValueVisitorInterface'

export interface VisitableMeasurableValueInterface {
  accept<R>(visitor: MeasurableValueVisitorInterface<R>): R
}
