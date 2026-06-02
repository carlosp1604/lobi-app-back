import { RoutePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/Route'
import { RouteCapabilityDto } from '~/src/modules/Activity/Application/Config/Capability/CapabilityDto'
import { RouteDtoTranslator } from '~/src/modules/Shared/Application/Translator/RouteDtoTranslator'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'

export class RouteCapabilityQueryDtoTranslator implements DtoTranslatorInterface<RoutePrimitives, RouteCapabilityDto | null> {
  public static readonly capabilityName = 'route'

  public translate(primitives: RoutePrimitives): RouteCapabilityDto {
    return {
      type: 'route',
      name: RouteCapabilityQueryDtoTranslator.capabilityName,
      data: new RouteDtoTranslator().translate(primitives),
    }
  }
}
