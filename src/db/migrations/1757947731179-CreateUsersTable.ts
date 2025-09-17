import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateUsersTable1757947731179 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS citext')

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isNullable: false,
            isGenerated: false,
          },
          {
            name: 'email',
            type: 'citext',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '64',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '32',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '32',
            isNullable: false,
          },
          {
            name: 'user_upload_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'email_verified_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true)
  }
}
