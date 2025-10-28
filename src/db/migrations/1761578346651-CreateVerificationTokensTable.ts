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
            isUnique: true,
          },
          {
            name: 'token_hash',
            type: 'varchar',
            length: '44',
            isNullable: false,
            isUnique: true,
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

    // Optimize queries
    await queryRunner.query(`
      CREATE UNIQUE INDEX index_verification_token_active_tokens
      ON verification_tokens (email, purpose)
      WHERE used_at IS NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS index_verification_token_active_tokens')
    await queryRunner.dropTable('verification_tokens', true)
  }
}
