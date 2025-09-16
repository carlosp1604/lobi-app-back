import { MigrationInterface, QueryRunner, Table, TableCheck, TableForeignKey } from 'typeorm'

export class CreateUserCredentialsTable1758044416478 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_credentials',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'password_hash',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'failed_attempts',
            type: 'int',
            isNullable: false,
            default: '0',
          },
          {
            name: 'locked_until',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'last_login_at',
            type: 'timestamptz',
            isNullable: true,
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
        ],
      }),
      true,
    )

    await queryRunner.createForeignKey(
      'user_credentials',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'foreign_key_user_credentials_user',
      }),
    )

    await queryRunner.createCheckConstraint(
      'user_credentials',
      new TableCheck({
        name: 'check_user_credentials_failed_attempts_non_negative',
        expression: 'failed_attempts >= 0',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('user_credentials', 'foreign_key_user_credentials_user')
    await queryRunner.dropCheckConstraint('user_credentials', 'check_user_credentials_failed_attempts_non_negative')
    await queryRunner.dropTable('user_credentials', true)
  }
}
