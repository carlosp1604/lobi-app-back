import { EntitySchema } from 'typeorm'
import { UserRawModel } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { SportRawModel } from '~/src/modules/Activity/Infrastructure/Entities/sport.entity'

export interface RawActivityConfig {
  capabilities: Record<string, unknown>
  specs: Record<string, unknown>
}

export interface ActivityRawModel {
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
  activity_config: RawActivityConfig
  location: string | null
  scheduled_at: Date
  created_at: Date
  updated_at: Date
}

export type ActivityRawModelWithRelations = ActivityRawModel & Partial<{ host: UserRawModel; sport: SportRawModel }>

export const ActivityEntity = new EntitySchema<ActivityRawModelWithRelations>({
  name: 'ActivityEntity',
  tableName: 'activities',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      nullable: false,
    },
    title: {
      type: String,
      length: 100,
      nullable: false,
    },
    description: {
      type: 'text',
      nullable: true,
    },
    status: {
      type: String,
      length: 20,
      nullable: false,
    },
    level_ids: {
      type: 'uuid',
      array: true,
      nullable: false,
      default: '{}',
    },
    sport_id: {
      type: 'uuid',
      nullable: false,
    },
    host_id: {
      type: 'uuid',
      nullable: false,
    },
    min_capacity: {
      type: 'integer',
      nullable: false,
      default: 2,
    },
    max_capacity: {
      type: 'integer',
      nullable: false,
    },
    min_duration: {
      type: 'integer',
      nullable: true,
    },
    max_duration: {
      type: 'integer',
      nullable: true,
    },
    current_participants: {
      type: 'integer',
      nullable: false,
      default: 1,
    },
    activity_config: {
      type: 'jsonb',
      nullable: false,
    },
    location: {
      type: 'geography',
      spatialFeatureType: 'Point',
      srid: 4326,
      nullable: true,
    },
    scheduled_at: {
      type: 'timestamptz',
      nullable: false,
    },
    created_at: {
      type: 'timestamptz',
      nullable: false,
    },
    updated_at: {
      type: 'timestamptz',
      nullable: false,
    },
  },
  relations: {
    host: {
      type: 'many-to-one',
      target: 'UserEntity',
      joinColumn: {
        name: 'host_id',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
    },
    sport: {
      type: 'many-to-one',
      target: 'SportEntity',
      joinColumn: {
        name: 'sport_id',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  indices: [
    {
      name: 'index_activities_filters_partial',
      columns: ['sport_id', 'scheduled_at'],
      // eslint-disable-next-line quotes
      where: "status IN ('open', 'confirmed') AND current_participants < max_capacity",
    },
    {
      name: 'index_activities_user_history',
      columns: ['host_id', 'scheduled_at'],
    },
  ],
})
