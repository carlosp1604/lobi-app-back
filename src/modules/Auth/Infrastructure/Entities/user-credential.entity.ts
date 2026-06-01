import { EntitySchema } from 'typeorm'
import { UserRawModel } from '~/src/modules/User/Infrastructure/Entities/user.entity'

export type UserCredentialRawModel = {
  user_id: string
  password_hash: string
  failed_attempts: number
  locked_until: Date | null
  last_login_at: Date | null
  created_at: Date
  updated_at: Date
}

export type UserCredentialRawWitRelationships = UserCredentialRawModel & Partial<{ user: Promise<UserRawModel> }>

export const UserCredentialEntity = new EntitySchema<UserCredentialRawWitRelationships>({
  name: 'UserCredentialEntity',
  tableName: 'user_credentials',
  columns: {
    user_id: {
      type: 'uuid',
      primary: true,
      nullable: false,
    },
    password_hash: {
      type: 'text',
      nullable: false,
    },
    failed_attempts: {
      type: 'int',
      nullable: false,
      default: 0,
    },
    locked_until: {
      type: 'timestamptz',
      nullable: true,
    },
    last_login_at: {
      type: 'timestamptz',
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
