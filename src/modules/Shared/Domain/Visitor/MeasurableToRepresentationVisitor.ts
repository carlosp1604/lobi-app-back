import { RPE } from '~/src/modules/Shared/Domain/ValueObject/Measurable/RPE'
import { Pace } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Pace'
import { Speed } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Speed'
import { Altitude } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Altitude'
import { Distance } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Distance'
import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Duration'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { MagnitudeRange, Rangeable } from '~/src/modules/Shared/Domain/ValueObject/Measurable/MagnitudeRange'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MeasurableValueVisitorInterface'
import { LocationRange } from '~/src/modules/Shared/Domain/ValueObject/Measurable/LocationRange'
import { Route } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Route'

export class MeasurableToRepresentationVisitor implements MeasurableValueVisitorInterface<string> {
  public visitDistance(distance: Distance): string {
    return distance.toString()
  }

  public visitAltitude(altitude: Altitude): string {
    return altitude.toString()
  }

  public visitPace(pace: Pace): string {
    return pace.toString()
  }

  public visitSpeed(speed: Speed): string {
    return speed.toString()
  }

  public visitDuration(duration: Duration): string {
    return duration.toString()
  }

  public visitRPE(rpe: RPE): string {
    return rpe.value
  }

  public visitLocation(location: Location): string {
    return location.toString()
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
  public visitLocationRange(range: LocationRange): string {
    const startRepresentation = range.start.accept(this)
    const endRepresentation = range.end.accept(this)

    return `(${startRepresentation}) - (${endRepresentation})`
  }

  public visitRoute(route: Route): string {
    return route.toString()
  }
}
