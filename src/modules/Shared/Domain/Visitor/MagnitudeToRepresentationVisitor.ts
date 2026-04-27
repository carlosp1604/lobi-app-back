import { RPE } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/RPE'
import { Pace } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Pace'
import { Speed } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Speed'
import { Altitude } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Altitude'
import { Distance } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Distance'
import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Duration'
import { MagnitudeRange, Rangeable } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/MagnitudeRange'
import { MagnitudeValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MagnitudeValueVisitorInterface'

export class MagnitudeToRepresentationVisitor implements MagnitudeValueVisitorInterface<string> {
  public visitAltitude(altitude: Altitude): string {
    return altitude.toString()
  }

  public visitDistance(distance: Distance): string {
    return distance.toString()
  }

  public visitDuration(duration: Duration): string {
    return duration.toString()
  }

  public visitMagnitudeRange(range: MagnitudeRange<Rangeable<unknown>>): string {
    const startRepresentation = range.start.accept(this)
    const endRepresentation = range.end.accept(this)
    const base = `[${startRepresentation} - ${endRepresentation}]`

    if (range.average) {
      const avg = range.average.accept(this)
      return `${base} (Avg: ${avg})`
    }

    return base
  }

  public visitPace(pace: Pace): string {
    return pace.toString()
  }

  public visitRPE(rpe: RPE): string {
    return rpe.value
  }

  public visitSpeed(speed: Speed): string {
    return speed.toString()
  }
}
