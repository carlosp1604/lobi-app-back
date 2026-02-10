import { EntitySchema } from 'typeorm'

export type VerificationTokenRawModel = {
  id: string
  email: string
  token_hash: string
  purpose: string
  created_at: Date
  expires_at: Date
  used_at: Date | null
}

export const VerificationTokenEntity = new EntitySchema<VerificationTokenRawModel>({
  name: 'VerificationTokenEntity',
  tableName: 'verification_tokens',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      nullable: false,
    },
    email: {
      type: 'citext',
      nullable: false,
    },
    token_hash: {
      type: 'text',
      nullable: false,
    },
    purpose: {
      type: String,
      length: 32,
      nullable: false,
    },
    expires_at: {
      type: 'timestamptz',
      nullable: false,
    },
    used_at: {
      type: 'timestamptz',
      nullable: true,
    },
    created_at: {
      type: 'timestamptz',
      nullable: false,
      default: () => 'now()',
    },
  },
})
