import { SpecTypeMap } from '~/src/modules/Activity/Domain/Config/Spec/SpecRegistry'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { EnforceAvailableSpecKeys } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'
import { TeamParticipantsSpecPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/TeamParticipantsSpec'
import { TeamParticipantsSpecDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Spec/TeamParticipantsSpecDtoTranslator'
import { IndividualParticipantsSpecPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/IndividualParticipantsSpec'
import { IndividualParticipantsSpecDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Spec/IndividualParticipantsSpecDtoTranslator'
import { IndividualParticipantsSpecDto, TeamParticipantsSpecDto } from '~/src/modules/Activity/Application/Dto/Config/Spec/SpecDto'

export type SpecTranslatorTypes<DataType, DtoType> = {
  input: DataType
  output: DtoType
}

export type SpecTranslatorTypeMap = EnforceAvailableSpecKeys<{
  team_participants: SpecTranslatorTypes<TeamParticipantsSpecPrimitives, TeamParticipantsSpecDto>
  individual_participants: SpecTranslatorTypes<IndividualParticipantsSpecPrimitives, IndividualParticipantsSpecDto>
}>

export class SpecTranslatorRegistry {
  private static readonly registry: {
    [K in keyof SpecTypeMap]: DtoTranslatorInterface<SpecTranslatorTypeMap[K]['input'], SpecTranslatorTypeMap[K]['output']>
  } = {
    [IndividualParticipantsSpecDtoTranslator.specName]: new IndividualParticipantsSpecDtoTranslator(),
    [TeamParticipantsSpecDtoTranslator.specName]: new TeamParticipantsSpecDtoTranslator(),
  }

  public static getTranslator<K extends keyof SpecTranslatorTypeMap>(spec: K) {
    const translator = this.registry[spec]

    if (!translator) {
      throw Error(`Spec DTO translator for '${spec}' is not registered`)
    }

    return translator
  }
}
