import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MeasurableValueVisitorInterface'

export interface VisitableMeasurableValueInterface {
  accept<R>(visitor: MeasurableValueVisitorInterface<R>): R
}
