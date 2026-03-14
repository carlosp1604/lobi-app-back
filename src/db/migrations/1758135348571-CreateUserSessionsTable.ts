import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm'

export class CreateUserSessionsTable1758135348571 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'token_hash',
            type: 'varchar',
            length: '44',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'revoked_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'ip_hash',
            type: 'varchar',
            length: '44',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'device_country_code',
            type: 'varchar',
            length: '2',
            isNullable: true,
          },
          {
            name: 'device_city',
            type: 'varchar',
            length: '255',
            isNullable: true,
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

    await queryRunner.createForeignKey(
      'user_sessions',
      new TableForeignKey({
        name: 'foreign_key_user_sessions_user',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    )

    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'index_user_sessions_user_id',
        columnNames: ['user_id'],
      }),
    )

    await queryRunner.query(`
      CREATE INDEX index_user_sessions_active_lookup
        ON user_sessions (user_id, expires_at, created_at DESC)
        WHERE revoked_at IS NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS index_user_sessions_active_lookup')
    await queryRunner.dropIndex('user_sessions', 'index_user_sessions_user_id')
    await queryRunner.dropForeignKey('user_sessions', 'foreign_key_user_sessions_user')
    await queryRunner.dropTable('user_sessions', true)
  }
}
