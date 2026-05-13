import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import {
  SpecTranslatorRegistry,
  SpecTranslatorTypeMap,
} from '~/src/modules/Activity/Application/Translator/Config/Spec/SpecTranslatorRegistry'

export class SpecTranslatorFactory {
  public getTranslator<K extends keyof SpecTranslatorTypeMap>(
    spec: K,
  ): ApplicationDtoTranslatorInterface<SpecTranslatorTypeMap[K]['input'], SpecTranslatorTypeMap[K]['output']> {
    return SpecTranslatorRegistry.getTranslator(spec)
  }
}
