import { RPE } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/RPE'
import { Pace } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Pace'
import { Speed } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Speed'
import { Altitude } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Altitude'
import { Distance } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Distance'
import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Duration'
import { MagnitudeRange, Rangeable } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/MagnitudeRange'
import { RPEApplicationDtoTranslator } from '~/src/modules/Shared/Application/Translator/RPEApplicationDtoTranslator'
import { PaceApplicationDtoTranslator } from '~/src/modules/Shared/Application/Translator/PaceApplicationDtoTranslator'
import { SpeedApplicationDtoTranslator } from '~/src/modules/Shared/Application/Translator/SpeedApplicationDtoTranslator'
import { MagnitudeValueVisitorInterface } from '~/src/modules/Shared/Domain/Visitor/MagnitudeValueVisitorInterface'
import { AltitudeApplicationDtoTranslator } from '~/src/modules/Shared/Application/Translator/AltitudeApplicationDtoTranslator'
import { DistanceApplicationDtoTranslator } from '~/src/modules/Shared/Application/Translator/DistanceApplicationDtoTranslator'
import { DurationApplicationDtoTranslator } from '~/src/modules/Shared/Application/Translator/DurationApplicationDtoTranslator'
import { MagnitudeRangeApplicationDtoTranslator } from '~/src/modules/Shared/Application/Translator/MagnitudeRangeApplicationDtoTranslator'
import { MagnitudeApplicationDto, MagnitudeRangeApplicationDto } from '~/src/modules/Shared/Application/DTO/MagnitudeApplicationDto'

export type PresentationMeasurableValueDto = MagnitudeApplicationDto | MagnitudeRangeApplicationDto

export class MagnitudeToPresentationVisitor implements MagnitudeValueVisitorInterface<PresentationMeasurableValueDto> {
  public visitAltitude(altitude: Altitude): MagnitudeApplicationDto {
    return new AltitudeApplicationDtoTranslator().translate(altitude)
  }

  public visitDistance(distance: Distance): MagnitudeApplicationDto {
    return new DistanceApplicationDtoTranslator().translate(distance)
  }

  public visitDuration(duration: Duration): MagnitudeApplicationDto {
    return new DurationApplicationDtoTranslator().translate(duration)
  }

  public visitMagnitudeRange(range: MagnitudeRange<Rangeable<unknown>>): PresentationMeasurableValueDto {
    return new MagnitudeRangeApplicationDtoTranslator().translate(range)
  }

  public visitPace(pace: Pace): MagnitudeApplicationDto {
    return new PaceApplicationDtoTranslator().translate(pace)
  }

  public visitRPE(rpe: RPE): MagnitudeApplicationDto {
    return new RPEApplicationDtoTranslator().translate(rpe)
  }

  public visitSpeed(speed: Speed): MagnitudeApplicationDto {
    return new SpeedApplicationDtoTranslator().translate(speed)
  }
}
