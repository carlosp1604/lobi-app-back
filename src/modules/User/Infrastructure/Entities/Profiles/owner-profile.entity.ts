import { EntitySchema } from 'typeorm'
import { UserRawModel } from '~/src/modules/User/Infrastructure/Entities/user.entity'

export type OwnerProfileRawModel = {
  id: string
  user_id: string
  company_name: string | null
  tax_id: string | null
  contact_phone: string | null
  created_at: Date
  updated_at: Date
}

export type OwnerProfileRawWithRelationships = OwnerProfileRawModel & Partial<{ user: Promise<UserRawModel> }>

export const OwnerProfileEntity = new EntitySchema<OwnerProfileRawWithRelationships>({
  name: 'OwnerProfileEntity',
  tableName: 'owner_profiles',
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
    company_name: {
      type: 'varchar',
      nullable: true,
      length: 256,
    },
    tax_id: {
      type: 'varchar',
      nullable: true,
      length: 50,
    },
    contact_phone: {
      type: 'varchar',
      nullable: true,
      length: 30,
    },
    created_at: {
      type: 'timestamptz',
      nullable: false,
      default: () => 'now()',
      createDate: true,
    },
    updated_at: {
      type: 'timestamptz',
      nullable: false,
      default: () => 'now()',
      updateDate: true,
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
