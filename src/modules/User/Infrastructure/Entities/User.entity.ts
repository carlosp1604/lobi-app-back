import { EntitySchema } from 'typeorm'
import { User } from '~/src/modules/User/Domain/User'
import { UserCredentialRawModel } from '~/src/modules/Auth/Infrastructure/Entities/UserCredential.entity'
import { UserSessionRawModel } from '~/src/modules/Auth/Infrastructure/Entities/UserSession.entity'

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

export type UserRawModelWithRelations = UserRawModel & {
  credential: UserCredentialRawModel | null
  sessions: Promise<Array<UserSessionRawModel>>
}

export const UserEntity = new EntitySchema<UserRawModelWithRelations>({
  name: 'User',
  tableName: 'users',
  target: User,
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
      joinColumn: {
        name: 'id',
        referencedColumnName: 'user_id',
      },
      inverseSide: 'user',
      cascade: true,
    },
    sessions: {
      type: 'one-to-many',
      target: 'UserSessionEntity',
      inverseSide: 'user',
      lazy: true,
      cascade: false,
    },
  },
})
