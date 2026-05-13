import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import {
  CapabilityTranslatorRegistry,
  CapabilityTranslatorTypeMap,
} from '~/src/modules/Activity/Application/Translator/Config/Capability/CapabilityTranslatorRegistry'

export class CapabilityTranslatorFactory {
  public getTranslator<K extends keyof CapabilityTranslatorTypeMap>(
    capability: K,
  ): ApplicationDtoTranslatorInterface<CapabilityTranslatorTypeMap[K]['input'], CapabilityTranslatorTypeMap[K]['output']> {
    return CapabilityTranslatorRegistry.getTranslator(capability)
  }
}
