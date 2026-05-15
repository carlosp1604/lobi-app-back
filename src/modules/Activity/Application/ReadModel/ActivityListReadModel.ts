import { SportReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportReadModel'
import { SportLevelReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportLevelReadModel'
import { ActivityHostReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityHostReadModel'
import { ActivityLocationReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityLocationReadModel'
import { ActivityParticipationReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityParticipationReadModel'

export interface ActivityListItemTeamConfig {
  minTeams: number
  maxTeams: number
  playersPerTeam: number
}

export interface ActivityListItemReadModelWithoutLevels {
  id: string
  title: string
  description: string | null
  status: string
  level_ids: Array<string>
  sport_id: string
  host_id: string
  min_capacity: number
  max_capacity: number
  team_config: ActivityListItemTeamConfig
  min_duration: number | null
  max_duration: number | null
  current_participants: number
  location_geojson: ActivityLocationReadModel | null
  sport: SportReadModel
  host: ActivityHostReadModel | null
  current_participation: ActivityParticipationReadModel | null
  scheduled_at: Date
  created_at: Date
  total_count: number
}

export type ActivityListItemReadModel = ActivityListItemReadModelWithoutLevels & { levels: Array<SportLevelReadModel> }

export interface ActivityListReadModel {
  items: Array<ActivityListItemReadModel>
  total: number
  hasNext: boolean
  hasPrevious: boolean
}
