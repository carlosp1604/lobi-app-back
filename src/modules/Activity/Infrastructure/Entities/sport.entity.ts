import { EntitySchema } from 'typeorm'
import { ActivityRawModel } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'

export type RawSportSpecs = {
  participants: {
    defaultMinPlayers: number
    teamsModule?: {
      defaultTeams: number
      defaultPlayersPerTeam: number
    }
  }
}

export type SportRawConfig = {
  capabilities: Array<string>
  specs: RawSportSpecs
}

export interface SportRawModel {
  id: string
  slug: string
  image_url: string | null
  config: SportRawConfig
  created_at: Date
  updated_at: Date
}

export type SportRawModelWithRelations = SportRawModel &
  Partial<{
    activities: Array<ActivityRawModel>
  }>

export const SportEntity = new EntitySchema<SportRawModelWithRelations>({
  name: 'SportEntity',
  tableName: 'sports',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      nullable: false,
    },
    slug: {
      type: String,
      length: 64,
      unique: true,
      nullable: false,
    },
    image_url: {
      type: String,
      length: 256,
      nullable: true,
    },
    config: {
      type: 'jsonb',
      nullable: false,
    },
    created_at: {
      type: 'timestamptz',
      nullable: false,
      createDate: true,
      default: () => 'now()',
    },
    updated_at: {
      type: 'timestamptz',
      nullable: false,
      updateDate: true,
      default: () => 'now()',
    },
  },
  relations: {
    activities: {
      type: 'one-to-many',
      target: 'ActivityEntity',
      inverseSide: 'sport',
      cascade: false,
    },
  },
})
