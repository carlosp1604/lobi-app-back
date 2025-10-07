import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm'

export class CreateDomainEventsTable1759846971317 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'domain_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'aggregate_type',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'aggregate_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: false,
            // eslint-disable-next-line quotes
            default: "'{}'::jsonb",
          },
          {
            name: 'version',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'occurred_at',
            type: 'timestamptz',
            isNullable: false,
          },
        ],
      }),
      true,
    )

    await queryRunner.createIndex(
      'domain_events',
      new TableIndex({
        name: 'index_domain_events_aggregate',
        columnNames: ['aggregate_type', 'aggregate_id', 'occurred_at'],
      }),
    )

    await queryRunner.createIndex(
      'domain_events',
      new TableIndex({
        name: 'index_domain_events_name',
        columnNames: ['name'],
      }),
    )

    await queryRunner.createIndex(
      'domain_events',
      new TableIndex({
        name: 'index_domain_events_occurred_at',
        columnNames: ['occurred_at'],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('domain_events', 'index_domain_events_occurred_at')
    await queryRunner.dropIndex('domain_events', 'index_domain_events_name')
    await queryRunner.dropIndex('domain_events', 'index_domain_events_aggregate')
    await queryRunner.dropTable('domain_events', true)
  }
}
