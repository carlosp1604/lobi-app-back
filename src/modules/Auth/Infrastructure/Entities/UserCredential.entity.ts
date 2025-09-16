import { EntitySchema } from 'typeorm'
import { UserRawModel } from '~/src/modules/User/Infrastructure/Entities/User.entity'

export type UserCredentialRaw = {
  user_id: string
  password_hash: string
  failed_attempts: number
  locked_until: Date | null
  last_login_at: Date | null
  created_at: Date
  updated_at: Date
}

type UserCredentialRawWitRelationships = UserCredentialRaw & { user: UserRawModel }

export const UserCredentialEntity = new EntitySchema<UserCredentialRawWitRelationships>({
  name: 'UserCredential',
  tableName: 'user_credentials',
  columns: {
    user_id: {
      type: 'string',
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
      default: () => 'now()',
    },
    updated_at: {
      type: 'timestamptz',
      nullable: false,
      default: () => 'now()',
    },
  },
  relations: {
    user: {
      type: 'one-to-one',
      target: 'User',
      joinColumn: { name: 'user_id' },
      onDelete: 'CASCADE',
    },
  },
})
