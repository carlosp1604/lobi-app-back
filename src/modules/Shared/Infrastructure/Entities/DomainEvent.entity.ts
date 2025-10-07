import { EntitySchema } from 'typeorm'

type NotUndefined<T> = Exclude<T, undefined>
export type NoUndefinedField<T> = { [P in keyof T]-?: NoUndefinedField<NotUndefined<T[P]>> }

type DomainEventRawPayload = Record<string, NoUndefinedField<unknown> | null>
type DomainEventRawMetadata = Record<string, NoUndefinedField<unknown> | null>

export interface DomainEventRawModel {
  id: string
  name: string
  aggregate_type: string
  aggregate_id: string
  payload: DomainEventRawPayload
  metadata: DomainEventRawMetadata
  version: number
  occurred_at: Date
}

export const DomainEventEntity = new EntitySchema<DomainEventRawModel>({
  name: 'DomainEventEntity',
  tableName: 'domain_events',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      nullable: false,
    },
    name: {
      type: String,
      length: 128,
      nullable: false,
    },
    aggregate_type: {
      type: String,
      length: 64,
      nullable: false,
    },
    aggregate_id: {
      type: 'uuid',
      nullable: false,
    },
    payload: {
      type: 'jsonb',
      nullable: false,
    },
    metadata: {
      type: 'jsonb',
      nullable: false,
      // eslint-disable-next-line quotes
      default: () => "'{}'::jsonb",
    },
    version: {
      type: Number,
      nullable: false,
    },
    occurred_at: {
      type: 'timestamptz',
      nullable: false,
    },
  },
  indices: [
    {
      name: 'index_domain_events_aggregate',
      columns: ['aggregate_type', 'aggregate_id', 'occurred_at'],
    },
    {
      name: 'index_domain_events_name',
      columns: ['name'],
    },
    {
      name: 'index_domain_events_occurred_at',
      columns: ['occurred_at'],
    },
  ],
})
