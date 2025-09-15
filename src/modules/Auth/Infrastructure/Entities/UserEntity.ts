import { EntitySchema } from 'typeorm'
import { User } from '~/src/modules/Auth/Domain/User'

export interface UserRawModel {
  id: string
  email: string
  username: string
  name: string
  status: string
  role: string
  user_upload_id: string | null
  email_verified_at: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type UserRawModelWithRelations = UserRawModel

export const UserEntity = new EntitySchema<UserRawModelWithRelations>({
  name: 'User',
  tableName: 'users',
  target: User,
  columns: {
    id: {
      type: 'string',
      primary: true,
      nullable: false,
    },
    email: {
      type: 'citext',
      length: 320,
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
      type: String,
      nullable: true,
    },
    email_verified_at: {
      type: 'timestamptz',
      nullable: false,
    },
    created_at: {
      type: 'timestamptz',
      createDate: true,
    },
    updated_at: {
      type: 'timestamptz',
      updateDate: true,
    },
    deleted_at: {
      type: 'timestamptz',
      deleteDate: true,
      nullable: true,
    },
  },
})
