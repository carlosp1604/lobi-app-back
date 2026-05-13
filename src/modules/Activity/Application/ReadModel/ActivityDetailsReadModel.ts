import { SportReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportReadModel'
import { ActivityHostReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityHostReadModel'
import { SportLevelReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportLevelReadModel'
import { ActivityLocationReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityLocationReadModel'
import { ActivityParticipationReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityParticipationReadModel'

interface ActivityConfigReadModel {
  capabilities: Record<string, unknown>
  specs: Record<string, unknown>
}

export interface ActivityDetailsReadModelWithoutLevels {
  id: string
  title: string
  description: string | null
  status: string
  level_ids: Array<string>
  sport_id: string
  host_id: string
  min_capacity: number
  max_capacity: number
  min_duration: number | null
  max_duration: number | null
  current_participants: number
  activity_config: ActivityConfigReadModel
  location_geojson: ActivityLocationReadModel | null
  sport: SportReadModel
  host: ActivityHostReadModel | null
  current_participation: ActivityParticipationReadModel | null
  scheduled_at: Date
  created_at: Date
}

export type ActivityDetailsReadModel = ActivityDetailsReadModelWithoutLevels & { levels: Array<SportLevelReadModel> }
