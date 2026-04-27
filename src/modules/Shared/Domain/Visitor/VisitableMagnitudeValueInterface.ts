import { MagnitudeValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MagnitudeValueVisitorInterface'

export interface VisitableMagnitudeValueInterface {
  accept<R>(visitor: MagnitudeValueVisitorInterface<R>): R
}
