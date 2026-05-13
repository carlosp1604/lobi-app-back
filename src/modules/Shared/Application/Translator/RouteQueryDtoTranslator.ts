import { RouteQueryDto } from '~/src/modules/Shared/Application/DTO/RouteQueryDto'
import { LocationQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationQueryDtoTranslator'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { RoutePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/Route'

export class RouteQueryDtoTranslator implements ApplicationDtoTranslatorInterface<RoutePrimitives, RouteQueryDto> {
  public translate(primitives: RoutePrimitives): RouteQueryDto {
    const { points } = primitives

    return {
      type: 'collection',
      points: points.map((point) => new LocationQueryDtoTranslator().translate(point)),
    }
  }
}
