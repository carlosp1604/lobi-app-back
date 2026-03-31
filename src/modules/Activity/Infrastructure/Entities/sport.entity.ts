import { EntitySchema } from 'typeorm'

type RawTranslation = {
  language: string
  field: string
  content: string
}

type RawSportDefaultConfig = {
  maxPlayers: number | null
  minPlayers: number
  extraSpecs: Record<string, any>
}

export interface SportRawModel {
  id: string
  slug: string
  translations: Array<RawTranslation>
  default_config: RawSportDefaultConfig
  icon_url: string | null
  created_at: Date
  updated_at: Date
}

export type SportRawModelWithRelations = SportRawModel

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
      length: 128,
      unique: true,
      nullable: false,
    },
    translations: {
      type: 'jsonb',
      nullable: false,
    },
    default_config: {
      type: 'jsonb',
      nullable: false,
    },
    icon_url: {
      type: String,
      length: 512,
      nullable: true,
    },
    created_at: {
      type: 'timestamptz',
      createDate: true,
      default: () => 'now()',
    },
    updated_at: {
      type: 'timestamptz',
      updateDate: true,
      default: () => 'now()',
    },
  },
})
