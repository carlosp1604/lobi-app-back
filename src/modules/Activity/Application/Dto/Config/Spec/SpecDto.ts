import { AvailableSpec } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'
import {
  IndividualParticipantsConfigDto,
  TeamParticipantsConfigDto,
} from '~/src/modules/Activity/Application/Dto/ParticipantsConfigDto'

export type BaseSpecDto = {
  readonly name: AvailableSpec
}

export interface IndividualParticipantsSpecDto extends BaseSpecDto {
  readonly data: IndividualParticipantsConfigDto
}

export interface TeamParticipantsSpecDto extends BaseSpecDto {
  readonly data: TeamParticipantsConfigDto
}
