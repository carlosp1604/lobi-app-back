import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateVerificationTokensTable1761578346651 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'verification_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'email',
            type: 'citext',
            isNullable: false,
          },
          {
            name: 'token_hash',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'purpose',
            type: 'varchar',
            length: '32',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'used_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true,
    )

    await queryRunner.query(`
      CREATE UNIQUE INDEX index_unique_active_token_per_user
        ON verification_tokens (email)
        WHERE used_at IS NULL
    `)

    await queryRunner.query(`
      CREATE INDEX index_verification_tokens_email
        ON verification_tokens (email)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS index_unique_active_token_per_user')
    await queryRunner.query('DROP INDEX IF EXISTS index_verification_tokens_email')
    await queryRunner.dropTable('verification_tokens', true)
  }
}
