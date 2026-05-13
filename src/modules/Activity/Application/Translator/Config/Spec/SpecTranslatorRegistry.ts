import { SpecTypeMap } from '~/src/modules/Activity/Domain/Config/Spec/SpecRegistry'
import { EnforceAvailableSpecKeys } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'
import { TeamParticipantsSpecPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/TeamParticipantsSpec'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { IndividualParticipantsSpecPrimitives } from '~/src/modules/Activity/Domain/Config/Spec/IndividualParticipantsSpec'
import { TeamParticipantsSpecQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Spec/TeamParticipantsSpecQueryDtoTranslator'
import { IndividualParticipantsSpecQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Config/Spec/IndividualParticipantsSpecQueryDtoTranslator'
import {
  IndividualParticipantsConfigQueryDto,
  TeamParticipantsConfigQueryDto,
} from '~/src/modules/Activity/Application/Dto/ParticipantsConfigQueryDto'

export type SpecTranslatorTypes<DataType, DtoType> = {
  input: DataType
  output: DtoType
}

export type SpecTranslatorTypeMap = EnforceAvailableSpecKeys<{
  team_participants: SpecTranslatorTypes<TeamParticipantsSpecPrimitives, TeamParticipantsConfigQueryDto>
  individual_participants: SpecTranslatorTypes<IndividualParticipantsSpecPrimitives, IndividualParticipantsConfigQueryDto>
}>

export class SpecTranslatorRegistry {
  private static readonly registry: {
    [K in keyof SpecTypeMap]: ApplicationDtoTranslatorInterface<SpecTranslatorTypeMap[K]['input'], SpecTranslatorTypeMap[K]['output']>
  } = {
    individual_participants: new IndividualParticipantsSpecQueryDtoTranslator(),
    team_participants: new TeamParticipantsSpecQueryDtoTranslator(),
  }

  public static getTranslator<K extends keyof SpecTranslatorTypeMap>(spec: K) {
    const translator = this.registry[spec]

    if (!translator) {
      throw Error(`Spec DTO translator for '${spec}' is not registered`)
    }

    return translator
  }
}
