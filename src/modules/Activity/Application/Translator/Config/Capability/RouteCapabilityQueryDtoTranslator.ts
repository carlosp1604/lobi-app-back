import { RouteQueryDto } from '~/src/modules/Shared/Application/DTO/RouteQueryDto'
import { RoutePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/Route'
import { RouteQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/RouteQueryDtoTranslator'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'

export class RouteCapabilityQueryDtoTranslator implements ApplicationDtoTranslatorInterface<RoutePrimitives, RouteQueryDto | null> {
  public translate(primitives: RoutePrimitives): RouteQueryDto | null {
    return new RouteQueryDtoTranslator().translate(primitives)
  }
}
