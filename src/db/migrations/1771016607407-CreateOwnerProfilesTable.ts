import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm'

export class CreateOwnerProfilesTable1771016607407 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'owner_profiles',
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
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'company_name',
            type: 'varchar',
            length: '256',
            isNullable: true,
          },
          {
            name: 'tax_id',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'contact_phone',
            type: 'varchar',
            length: '30',
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
      'owner_profiles',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'foreign_key_owner_profiles_user',
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('owner_profiles', true)
  }
}
