import { EntitySchema } from 'typeorm'

export interface ParticipantRawModel {
  id: string
  status: string
  deleted_at: Date | null
}

export const ParticipantEntity = new EntitySchema<ParticipantRawModel>({
  name: 'ParticipantEntity',
  tableName: 'users',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      nullable: false,
    },
    status: {
      type: String,
      length: 32,
      nullable: false,
    },
    deleted_at: {
      type: 'timestamptz',
      deleteDate: true,
      nullable: true,
    },
  },
})
