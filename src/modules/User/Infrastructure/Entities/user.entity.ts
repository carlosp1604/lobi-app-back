import { EntitySchema } from 'typeorm'
import { UserCredentialRawModel } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
import { UserSessionRawModel } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { SportsmanProfileRawModel } from '~/src/modules/User/Infrastructure/Entities/Profiles/sportsman-profile.entity'
import { OwnerProfileRawModel } from '~/src/modules/User/Infrastructure/Entities/Profiles/owner-profile.entity'
import { ActivityRawModel } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'

export interface UserRawModel {
  id: string
  email: string
  username: string
  name: string
  status: string
  role: string
  user_upload_id: string | null
  email_verified_at: Date
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export type UserRawModelWithRelations = UserRawModel &
  Partial<{
    credential: UserCredentialRawModel | null
    sessions: Array<UserSessionRawModel>
    sportsmanProfile: SportsmanProfileRawModel | null
    ownerProfile: OwnerProfileRawModel | null
    activities: Array<ActivityRawModel>
  }>

export const UserEntity = new EntitySchema<UserRawModelWithRelations>({
  name: 'UserEntity',
  tableName: 'users',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      nullable: false,
    },
    email: {
      type: 'citext',
      unique: true,
      nullable: false,
    },
    username: {
      type: String,
      length: 64,
      unique: true,
      nullable: false,
    },
    name: {
      type: String,
      length: 255,
      nullable: false,
    },
    status: {
      type: String,
      length: 32,
      nullable: false,
    },
    role: {
      type: String,
      length: 32,
      nullable: false,
    },
    user_upload_id: {
      type: 'uuid',
      nullable: true,
    },
    email_verified_at: {
      type: 'timestamptz',
      nullable: false,
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
    deleted_at: {
      type: 'timestamptz',
      deleteDate: true,
      nullable: true,
    },
  },
  relations: {
    credential: {
      type: 'one-to-one',
      target: 'UserCredentialEntity',
      lazy: false,
      inverseSide: 'user',
      cascade: true,
    },
    sessions: {
      type: 'one-to-many',
      target: 'UserSessionEntity',
      inverseSide: 'user',
      lazy: false,
      cascade: false,
    },
    sportsmanProfile: {
      type: 'one-to-one',
      target: 'SportsmanProfileEntity',
      lazy: false,
      inverseSide: 'user',
      cascade: true,
    },
    ownerProfile: {
      type: 'one-to-one',
      target: 'OwnerProfileEntity',
      lazy: false,
      inverseSide: 'user',
      cascade: true,
    },
    activities: {
      type: 'one-to-many',
      target: 'ActivityEntity',
      inverseSide: 'host',
      cascade: false,
    },
  },
})
