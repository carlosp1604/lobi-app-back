import { SportLevelReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportLevelReadModel'

export type IndividualParticipantsDefinitionReadModel = {
  defaultMinPlayers: number
  defaultMaxPlayers: number
}

export type TeamParticipantsDefinitionReadModel = {
  defaultMinPlayers: number
  defaultTeams: number
  defaultPlayersPerTeam: number
}

export type SportSpecsReadModel = {
  individual_participants?: IndividualParticipantsDefinitionReadModel
  team_participants?: TeamParticipantsDefinitionReadModel
}

export type SportConfigReadModel = {
  capabilities: Array<string>
  specs: SportSpecsReadModel
}

export interface SportDetailsReadModelWithoutLevels {
  id: string
  slug: string
  image_url: string | null
  config: SportConfigReadModel
  created_at: Date
  updated_at: Date
}

export type SportDetailsReadModel = SportDetailsReadModelWithoutLevels & {
  levels: Array<SportLevelReadModel>
}
