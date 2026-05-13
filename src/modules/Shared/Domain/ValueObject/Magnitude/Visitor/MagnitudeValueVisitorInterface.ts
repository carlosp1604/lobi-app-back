import { RPE } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/RPE'
import { Pace } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Pace'
import { Speed } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Speed'
import { Altitude } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Altitude'
import { Distance } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Distance'
import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Duration'
import { MagnitudeRange, Rangeable } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/MagnitudeRange'

export interface MagnitudeValueVisitorInterface<R> {
  visitAltitude(altitude: Altitude): R
  visitPace(pace: Pace): R
  visitSpeed(speed: Speed): R
  visitDistance(distance: Distance): R
  visitDuration(duration: Duration): R
  visitRPE(rpe: RPE): R
  visitMagnitudeRange(range: MagnitudeRange<Rangeable<unknown, unknown>, unknown>): R
}
