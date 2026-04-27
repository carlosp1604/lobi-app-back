import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm'

export class CreateParticipationsTable1777298014442 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'participations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'activity_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'joined_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'left_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    )

    // Foreign keys
    await queryRunner.createForeignKeys('participations', [
      new TableForeignKey({
        columnNames: ['activity_id'],
        referencedTableName: 'activities',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'foreign_key_participation_activity',
      }),
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'foreign_key_participation_user',
      }),
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('participations', 'foreign_key_participation_activity')
    await queryRunner.dropForeignKey('participations', 'foreign_key_participation_user')

    await queryRunner.dropTable('participations')
  }
}
