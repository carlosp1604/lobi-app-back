import { RPE } from '~/src/modules/Shared/Domain/ValueObject/Measurable/RPE'
import { Pace } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Pace'
import { Speed } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Speed'
import { Altitude } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Altitude'
import { Distance } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Distance'
import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Duration'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { MagnitudeRange, Rangeable } from '~/src/modules/Shared/Domain/ValueObject/Measurable/MagnitudeRange'
import { LocationRange } from '~/src/modules/Shared/Domain/ValueObject/Measurable/LocationRange'

export interface MeasurableValueVisitorInterface<R> {
  visitAltitude(altitude: Altitude): R
  visitPace(pace: Pace): R
  visitSpeed(speed: Speed): R
  visitDistance(distance: Distance): R
  visitDuration(duration: Duration): R
  visitRPE(rpe: RPE): R
  visitMagnitudeRange(range: MagnitudeRange<Rangeable<unknown>>): R
  visitLocation(location: Location): R
  visitLocationRange(range: LocationRange): R
}
