import { EntitySchema } from 'typeorm'
import { UserRawModel } from '~/src/modules/User/Infrastructure/Entities/user.entity'

export type SportsmanProfileRawModel = {
  id: string
  user_id: string
  birth_date: string | null
  bio: string | null
  created_at: Date
  updated_at: Date
}

export type SportsmanProfileRawWithRelationships = SportsmanProfileRawModel & Partial<{ user: Promise<UserRawModel> }>

export const SportsmanProfileEntity = new EntitySchema<SportsmanProfileRawWithRelationships>({
  name: 'SportsmanProfileEntity',
  tableName: 'sportsman_profiles',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      nullable: false,
    },
    user_id: {
      type: 'uuid',
      nullable: false,
      unique: true,
    },
    birth_date: {
      type: 'date',
      nullable: true,
    },
    bio: {
      type: 'text',
      nullable: true,
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
    user: {
      type: 'one-to-one',
      target: 'UserEntity',
      joinColumn: {
        name: 'user_id',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
      lazy: true,
    },
  },
})
