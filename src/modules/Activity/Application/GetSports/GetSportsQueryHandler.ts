import { EntityManager } from 'typeorm'
import { SportLevelReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportLevelReadModel'
import { BasicSportRankingSystem } from '~/src/modules/Activity/Domain/Sport/Ranking/BasicSportRankingSystem'
import { GetSportsQueryResponseDto } from '~/src/modules/Activity/Application/GetSports/GetSportsQueryResponseDto'
import { CapabilityPayloadContractFactory } from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractFactory'
import { GetSportsQueryResponseDtoTranslator } from '~/src/modules/Activity/Application/GetSports/GetSportsQueryResponseDtoTranslator'
import {
  SportDetailsReadModel,
  SportDetailsReadModelWithoutLevels,
} from '~/src/modules/Activity/Application/ReadModel/Sport/SportDetailsReadModel'
import { SpecPayloadContractFactory } from '~/src/modules/Activity/Application/Config/Spec/SpecPayloadContractFactory'

export class GetSportsQueryHandler {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly capabilityPayloadContractFactory: CapabilityPayloadContractFactory,
    private readonly specPayloadContractFactory: SpecPayloadContractFactory,
  ) {}

  public async execute(): Promise<GetSportsQueryResponseDto> {
    const rawSports = await this.runQuery()

    return new GetSportsQueryResponseDtoTranslator(this.capabilityPayloadContractFactory, this.specPayloadContractFactory).translate({
      sports: rawSports,
      count: rawSports.length,
    })
  }

  private async runQuery(): Promise<Array<SportDetailsReadModel>> {
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
