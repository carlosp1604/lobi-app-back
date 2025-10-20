import { EntitySchema } from 'typeorm'
import { UserRawModel } from '~/src/modules/User/Infrastructure/Entities/user.entity'

export interface UserSessionRawModel {
  id: string
  user_id: string
  token_hash: string
  expires_at: Date
  revoked_at: Date | null
  ip_hash: string | null
  user_agent: string
  device_country_code: string | null
  device_city: string | null
  created_at: Date
  updated_at: Date
}

export type UserSessionRawWithRelationships = UserSessionRawModel & Partial<{ user: Promise<UserRawModel> }>

export const UserSessionEntity = new EntitySchema<UserSessionRawWithRelationships>({
  name: 'UserSessionEntity',
  tableName: 'user_sessions',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      nullable: false,
    },
    user_id: {
      type: 'uuid',
      nullable: false,
    },
    token_hash: {
      type: String,
      length: 44,
      nullable: false,
      unique: true,
    },
    expires_at: {
      type: 'timestamptz',
      nullable: false,
    },
    revoked_at: {
      type: 'timestamptz',
      nullable: true,
    },
    ip_hash: {
      type: String,
      length: 44,
      nullable: true,
    },
    user_agent: {
      type: String,
      length: 512,
      nullable: false,
    },
    device_country_code: {
      type: String,
      length: 2,
      nullable: true,
    },
    device_city: {
      type: String,
      length: 255,
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
  relations: {
    user: {
      type: 'many-to-one',
      target: 'UserEntity',
      joinColumn: {
        name: 'user_id',
        referencedColumnName: 'id',
      },
      onDelete: 'CASCADE',
      lazy: true,
    },
  },
  indices: [
    {
      name: 'idx_user_sessions_user_id',
      columns: ['user_id'],
    },
    {
      name: 'idx_user_sessions_expires_at',
      columns: ['expires_at'],
    },
  ],
})
