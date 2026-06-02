import { RouteDto } from '~/src/modules/Shared/Application/DTO/RouteDto'
import { LocationQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationQueryDtoTranslator'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { RoutePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/Route'

export class RouteQueryDtoTranslator implements DtoTranslatorInterface<RoutePrimitives, RouteDto> {
  public translate(primitives: RoutePrimitives): RouteDto {
    const { points } = primitives

    return {
      type: 'route',
      points: points.map((point) => new LocationQueryDtoTranslator().translate(point)),
    }
  }
}
