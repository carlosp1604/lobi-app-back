import { AvailableSpec } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'

export type AllowedParticipantSpec = Extract<AvailableSpec, 'individual_participants' | 'team_participants'>

export interface BaseParticipantsSpecSchemaDto {
  allowedSpecs: Array<AllowedParticipantSpec>
  defaultSpec: AllowedParticipantSpec
  availableFields: Array<string>
  optionalFields: Array<string>
}

export interface IndividualParticipantsSpecSchemaDto extends BaseParticipantsSpecSchemaDto {
  defaultMinPlayers: number
  defaultMaxPlayers: number
  players: {
    min: number
    max: number
  }
}

export interface TeamParticipantsSpecSchemaDto extends BaseParticipantsSpecSchemaDto {
  defaultPlayers: number
  defaultTeams: number
  defaultPlayersPerTeam: number
  teams: {
    min: number
    max: number
  }
  playersPerTeam: {
    min: number
    max: number
  }
}
