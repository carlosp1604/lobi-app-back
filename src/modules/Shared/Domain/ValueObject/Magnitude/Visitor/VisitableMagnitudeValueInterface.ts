import { MagnitudeValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Visitor/MagnitudeValueVisitorInterface'

export interface VisitableMagnitudeValueInterface {
  accept<R>(visitor: MagnitudeValueVisitorInterface<R>): R
}
