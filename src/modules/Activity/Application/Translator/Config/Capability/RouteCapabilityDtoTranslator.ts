import { RoutePrimitives } from '~/src/modules/Shared/Domain/ValueObject/Location/Route'
import { RouteCapabilityDto } from '~/src/modules/Activity/Application/Dto/Config/Capability/CapabilityDto'
import { RouteDtoTranslator } from '~/src/modules/Shared/Application/Translator/RouteDtoTranslator'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'

export class RouteCapabilityDtoTranslator implements DtoTranslatorInterface<RoutePrimitives, RouteCapabilityDto | null> {
  public static readonly capabilityName = 'route'

  public translate(primitives: RoutePrimitives): RouteCapabilityDto {
    return {
      type: 'route',
      name: RouteCapabilityDtoTranslator.capabilityName,
      data: new RouteDtoTranslator().translate(primitives),
    }
  }
}
