import { RouteDto } from '~/src/modules/Shared/Application/DTO/RouteDto'
import { RoutePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/Route'
import { LocationDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationDtoTranslator'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'

export class RouteDtoTranslator implements DtoTranslatorInterface<RoutePrimitives, RouteDto> {
  public translate(primitives: RoutePrimitives): RouteDto {
    const { points } = primitives

    return {
      points: points.map((point) => new LocationDtoTranslator().translate(point)),
    }
  }
}
