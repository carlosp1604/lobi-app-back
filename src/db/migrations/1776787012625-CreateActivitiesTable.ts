import { MigrationInterface, QueryRunner, Table, TableCheck, TableForeignKey, TableIndex } from 'typeorm'

export class CreateActivitiesTable1776787012625 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis;')

    await queryRunner.createTable(
      new Table({
        name: 'activities',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'level_ids',
            type: 'uuid',
            isArray: true,
            isNullable: false,
            // eslint-disable-next-line quotes
            default: "'{}'",
          },
          {
            name: 'sport_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'host_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'min_capacity',
            type: 'integer',
            isNullable: false,
            default: 2,
          },
          {
            name: 'max_capacity',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'current_participants',
            type: 'integer',
            isNullable: false,
            default: 1,
          },
          {
            name: 'min_duration',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'max_duration',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'activity_config',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'location',
            type: 'geography',
            spatialFeatureType: 'Point',
            srid: 4326,
            isNullable: true,
          },
          {
            name: 'scheduled_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    )

    // Foreign keys
    await queryRunner.createForeignKeys('activities', [
      new TableForeignKey({
        columnNames: ['host_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'foreign_key_activity_host_user',
      }),
      new TableForeignKey({
        columnNames: ['sport_id'],
        referencedTableName: 'sports',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'foreign_key_activity_sport',
      }),
    ])

    // Partial Indices
    await queryRunner.query(`
      CREATE INDEX "index_active_activities_location"
      ON "activities" USING GIST ("location")
      WHERE "status" IN ('open', 'confirmed')
        AND "current_participants" < "max_capacity";
    `)

    await queryRunner.createIndex(
      'activities',
      new TableIndex({
        name: 'index_activities_filters_partial',
        columnNames: ['sport_id', 'scheduled_at'],
        // eslint-disable-next-line quotes
        where: "status IN ('open', 'confirmed') AND current_participants < max_capacity",
      }),
    )

    // Index for users activities history
    await queryRunner.createIndex(
      'activities',
      new TableIndex({
        name: 'index_activities_user_history',
        columnNames: ['host_id', 'scheduled_at'],
      }),
    )

    // GIN Indices
    await queryRunner.query(`
      CREATE INDEX "index_activities_level_ids_gin"
        ON "activities" USING GIN ("level_ids");
    `)

    // Constraints
    await queryRunner.createCheckConstraints('activities', [
      new TableCheck({
        name: 'check_activities_min_capacity_non_negative',
        expression: 'min_capacity >= 0',
      }),
      new TableCheck({
        name: 'check_activities_max_capacity_non_negative',
        expression: 'max_capacity >= 0',
      }),
      new TableCheck({
        name: 'check_activities_current_participants_non_negative',
        expression: 'current_participants >= 0',
      }),
      new TableCheck({
        name: 'check_activities_capacity_logic',
        expression: 'min_capacity <= max_capacity',
      }),
      new TableCheck({
        name: 'check_activities_participants_limit',
        expression: 'current_participants <= max_capacity',
      }),
      new TableCheck({
        name: 'check_activities_min_duration_non_negative',
        expression: 'min_duration IS NULL OR (min_duration >= 0)',
      }),
      new TableCheck({
        name: 'check_activities_max_duration_non_negative',
        expression: 'max_duration IS NULL OR (max_duration >= 0)',
      }),
      new TableCheck({
        name: 'check_activities_duration_logic',
        expression: 'min_duration IS NULL OR max_duration IS NULL OR (min_duration <= max_duration)',
      }),
      new TableCheck({
        name: 'check_activities_min_duration_requires_max',
        expression: 'min_duration IS NULL OR max_duration IS NOT NULL',
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('activities', 'foreign_key_activity_host_user')
    await queryRunner.dropForeignKey('activities', 'foreign_key_activity_sport')

    await queryRunner.query('DROP INDEX IF EXISTS "index_active_activities_location"')
    await queryRunner.query('DROP INDEX IF EXISTS "index_activities_level_ids_gin"')

    await queryRunner.dropIndex('activities', 'index_activities_filters_partial')
    await queryRunner.dropIndex('activities', 'index_activities_user_history')

    await queryRunner.dropCheckConstraint('activities', 'check_activities_min_capacity_non_negative')
    await queryRunner.dropCheckConstraint('activities', 'check_activities_max_capacity_non_negative')
    await queryRunner.dropCheckConstraint('activities', 'check_activities_current_participants_non_negative')
    await queryRunner.dropCheckConstraint('activities', 'check_activities_capacity_logic')
    await queryRunner.dropCheckConstraint('activities', 'check_activities_participants_limit')
    await queryRunner.dropCheckConstraint('activities', 'check_activities_min_duration_non_negative')
    await queryRunner.dropCheckConstraint('activities', 'check_activities_max_duration_non_negative')
    await queryRunner.dropCheckConstraint('activities', 'check_activities_duration_logic')
    await queryRunner.dropCheckConstraint('activities', 'check_activities_min_duration_requires_max')

    await queryRunner.dropTable('activities')
  }
}
