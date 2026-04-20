import { RPE } from '~/src/modules/Shared/Domain/ValueObject/Measurable/RPE'
import { Pace } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Pace'
import { Speed } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Speed'
import { Altitude } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Altitude'
import { Distance } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Distance'
import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Duration'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { BoundedNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/BoundedNumber'
import { LocationRange } from '~/src/modules/Shared/Domain/ValueObject/Measurable/LocationRange'
import { MagnitudeRange, Rangeable } from '~/src/modules/Shared/Domain/ValueObject/Measurable/MagnitudeRange'
import { MeasurableValueVisitorInterface } from '~/src/modules/Shared/Domain/ValueObject/Visitor/MeasurableValueVisitorInterface'

export type DisplayValue = {
  long: string
  short: string
}

export type ScalarPoint = {
  type: 'scalar'
  value: number
  unit: string
  conversions?: Record<string, number>
  formatted: Record<string, DisplayValue>
  format?: string | string[]
}

export type GeographicPoint = {
  type: 'geographic'
  lat: number
  lng: number
}

export type PointDto = { kind: 'point' } & (ScalarPoint | GeographicPoint)

export type RangeDto = {
  kind: 'range'
  start: PointDto
  end: PointDto
  isSingleValue: boolean
}

export type PresentationMeasurableValueDto = PointDto | RangeDto

export class MeasurableToPresentationVisitor implements MeasurableValueVisitorInterface<PresentationMeasurableValueDto> {
  public visitPace(pace: Pace): PointDto {
    const paceInKm = pace.convertTo('min/km')
    const paceInMi = pace.convertTo('min/mi')

    return {
      kind: 'point',
      type: 'scalar',
      value: paceInKm.numericValue,
      unit: 'min/km',
      conversions: {
        'min/km': paceInKm.round(3),
        'min/mi': paceInMi.round(3),
      },
      formatted: {
        'min/km': {
          long: `${this.formatPaceFromSeconds(paceInKm, true)} min/km`,
          short: `${this.formatPaceFromSeconds(paceInKm)} min/km`,
        },
        'min/mi': {
          long: `${this.formatPaceFromSeconds(paceInMi, true)} min/mi`,
          short: `${this.formatPaceFromSeconds(paceInMi)} min/mi`,
        },
      },
    }
  }

  public visitDistance(distance: Distance): PointDto {
    const distanceInM = distance.convertTo('m')
    const distanceInKm = distance.convertTo('km')
    const distanceInMi = distance.convertTo('mi')

    const formattedMeters = `${distanceInM.round(2)} m`
    const formattedKm = `${distanceInKm.round(3)} km`
    const formattedMi = `${distanceInMi.round(3)} mi`

    return {
      kind: 'point',
      type: 'scalar',
      value: distanceInM.numericValue,
      unit: Distance.DEFAULT_UNIT,
      conversions: {
        m: distanceInM.round(2),
        km: distanceInKm.round(3),
        mi: distanceInMi.round(3),
      },
      formatted: {
        m: { short: formattedMeters, long: formattedMeters },
        km: { short: formattedKm, long: formattedKm },
        mi: { short: formattedMi, long: formattedMi },
      },
    }
  }

  public visitAltitude(altitude: Altitude): PointDto {
    const altitudeInM = altitude.convertTo('m')
    const altitudeInFt = altitude.convertTo('ft')

    const formattedMeters = `${altitudeInM.round(2)} m`
    const formattedFt = `${altitudeInFt.round(2)} ft`

    return {
      kind: 'point',
      type: 'scalar',
      value: altitudeInM.numericValue,
      unit: Altitude.DEFAULT_UNIT,
      conversions: {
        m: altitudeInM.round(2),
        ft: altitudeInFt.round(2),
      },
      formatted: {
        m: { short: formattedMeters, long: formattedMeters },
        ft: { short: formattedFt, long: formattedFt },
      },
    }
  }

  public visitSpeed(speed: Speed): PointDto {
    const speedInKmh = speed.convertTo('km/h')
    const speedInMph = speed.convertTo('mi/h')

    const formattedKmh = `${speedInKmh.round(2)} km/h`
    const formattedMph = `${speedInMph.round(2)} mi/h`

    return {
      kind: 'point',
      type: 'scalar',
      value: speedInKmh.numericValue,
      unit: Speed.DEFAULT_UNIT,
      conversions: {
        'km/h': speedInKmh.round(2),
        'mi/h': speedInMph.round(2),
      },
      formatted: {
        'km/h': { short: formattedKmh, long: formattedKmh },
        'mi/h': { short: formattedMph, long: formattedMph },
      },
    }
  }

  public visitDuration(duration: Duration): PointDto {
    const formattedSeconds = this.formatDurationFromSeconds(duration.value)

    return {
      kind: 'point',
      type: 'scalar',
      value: duration.value.numericValue,
      unit: 's',
      formatted: {
        s: { short: formattedSeconds, long: formattedSeconds },
      },
      format: ['HH:MM:SS', 'MM:SS'],
    }
  }

  public visitRPE(rpe: RPE): PointDto {
    const formattedRpe = `${rpe.value}`

    return {
      kind: 'point',
      type: 'scalar',
      value: Number(rpe.value),
      unit: 'rpe',
      formatted: {
        rpe: { short: formattedRpe, long: formattedRpe },
      },
    }
  }

  public visitMagnitudeRange(range: MagnitudeRange<Rangeable<unknown>>): PresentationMeasurableValueDto {
    return {
      kind: 'range',
      start: range.start.accept(this) as PointDto,
      end: range.end.accept(this) as PointDto,
      isSingleValue: range.isSingleValue(),
    }
  }

  public visitLocation(location: Location): PointDto {
    return {
      type: 'geographic',
      kind: 'point',
      lat: location.value.lat.numericValue,
      lng: location.value.lng.numericValue,
    }
  }

  private formatPaceFromSeconds(magnitude: BoundedNumber, withMillis: boolean = false): string {
    const totalSeconds = withMillis ? magnitude.round(3) : magnitude.round(0)
    const absoluteSeconds = Math.abs(totalSeconds)

    const minutes = Math.floor(absoluteSeconds / 60)
    const seconds = Math.floor(absoluteSeconds % 60)

    let formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    if (withMillis) {
      const fraction = (absoluteSeconds % 1).toFixed(3).split('.')[1] || '000'
      formatted += `.${fraction}`
    }

    return magnitude.numericValue < 0 ? `-${formatted}` : formatted
  }

  private formatDurationFromSeconds(totalSeconds: BoundedNumber): string {
    const numericValue = totalSeconds.numericValue
    const hours = Math.floor(numericValue / 3600)
    const minutes = Math.floor((numericValue % 3600) / 60)
    const seconds = numericValue % 60

    const m = minutes.toString().padStart(2, '0')
    const s = seconds.toString().padStart(2, '0')

    return hours > 0 ? `${hours.toString().padStart(2, '0')}:${m}:${s}` : `${m}:${s}`
  }

  visitLocationRange(range: LocationRange): PresentationMeasurableValueDto {
    return {
      kind: 'range',
      start: range.start.accept(this) as PointDto,
      end: range.end.accept(this) as PointDto,
      isSingleValue: range.isSingleValue(),
    }
  }
}
