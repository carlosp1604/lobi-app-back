import sports from '~/src/modules/Activity/Infrastructure/Data/sports.json'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class SeedSportsTable1777494402403 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into('sports')
      .values(sports)
      .orUpdate(['slug', 'config', 'image_url'], ['id'])
      .execute()
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const ids = sports.map((sport) => sport.id)
    await queryRunner.manager.createQueryBuilder().delete().from('sports').where('id IN (:...ids)', { ids }).execute()
  }
}
