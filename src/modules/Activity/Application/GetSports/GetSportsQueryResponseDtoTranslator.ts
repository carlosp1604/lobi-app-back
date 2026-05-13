import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { SportDetailsReadModel } from '~/src/modules/Activity/Application/ReadModel/Sport/SportDetailsReadModel'
import { RankingCapabilityPayloadContract } from '~/src/modules/Activity/Application/Config/Capability/RankingCapabilityPayloadContract'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { CapabilityPayloadContractFactory } from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractFactory'
import { GetSportsQueryResponseDto, SportDetailsQueryDto } from '~/src/modules/Activity/Application/GetSports/GetSportsQueryResponseDto'
import { SpecPayloadContractFactory } from '~/src/modules/Activity/Application/Config/Spec/SpecPayloadContractFactory'
import { AvailableSpec } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'

export interface GetSportsResponseContext {
  sports: Array<SportDetailsReadModel>
  count: number
}

export class GetSportsQueryResponseDtoTranslator
  implements ApplicationDtoTranslatorInterface<GetSportsResponseContext, GetSportsQueryResponseDto>
{
  constructor(
    private readonly capabilityPayloadContractFactory: CapabilityPayloadContractFactory,
    private readonly specPayloadContractFactory: SpecPayloadContractFactory,
  ) {}

  public translate(context: GetSportsResponseContext): GetSportsQueryResponseDto {
    return {
      sports: context.sports.map((sportDetailsReadModel) => {
        return this.translateSport(sportDetailsReadModel)
      }),
      count: context.count,
    }
  }

  private translateSport(sportDetailsReadModel: SportDetailsReadModel): SportDetailsQueryDto {
    const capabilities = sportDetailsReadModel.config.capabilities.reduce((accumulator, capabilityName) => {
      const contract = this.capabilityPayloadContractFactory.getContract(capabilityName as AvailableCapability)

      if (capabilityName === 'ranking') {
        const rankingContract = contract as RankingCapabilityPayloadContract
        accumulator[capabilityName] = rankingContract.getSchema(sportDetailsReadModel.levels)
        return accumulator
      }

      accumulator[capabilityName] = contract.getSchema()
      return accumulator
    }, {})

    const specs = Object.keys(sportDetailsReadModel.config.specs).reduce((accumulator, specName) => {
      const contract = this.specPayloadContractFactory.getContract(specName as AvailableSpec)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      accumulator[specName] = contract.getSchema(sportDetailsReadModel.config.specs[specName])
      return accumulator
    }, {})

    return {
      id: sportDetailsReadModel.id,
      slug: sportDetailsReadModel.slug,
      config: {
        capabilities,
        specs,
      },
      image_url: sportDetailsReadModel.image_url,
    }
  }
}
