import { EntityManager } from 'typeorm'
import { SportLevelReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportLevelReadModel'
import { SportsFinderInterface } from '~/src/modules/Activity/Application/GetSports/SportsFinderInterface'
import { BasicSportRankingSystem } from '~/src/modules/Activity/Domain/Sport/Ranking/BasicSportRankingSystem'
import {
  SportDetailsReadModel,
  SportDetailsReadModelWithoutLevels,
} from '~/src/modules/Activity/Application/ReadModel/Sport/SportDetailsReadModel'

export class PostgreSqlSportsFinder implements SportsFinderInterface {
  constructor(private readonly entityManager: EntityManager) {}

  /**
   * Retrieves all available sports
   * @returns An array of SportDetailsReadModel
   */
  public async find(): Promise<Array<SportDetailsReadModel>> {
    const rawResult: Array<SportDetailsReadModelWithoutLevels> = await this.entityManager.query(
      `
        SELECT
          id,
          slug,
          image_url,
          config,
          created_at,
          updated_at
        FROM sports
      `,
    )

    if (rawResult.length === 0) {
      return []
    }

    return rawResult.map((rawSport) => this.addLevels(rawSport))
  }

  private addLevels(raw: SportDetailsReadModelWithoutLevels): SportDetailsReadModel {
    const levels: Array<SportLevelReadModel> = BasicSportRankingSystem.map((level) => {
      return {
        id: level.id.value,
        slug: level.slug.value,
        order: level.order,
        imageUrl: level.imageUrl ? level.imageUrl.value : null,
      }
    })

    return {
      ...raw,
      levels,
    }
  }
}
