import { SportsFinderInterface } from '~/src/modules/Activity/Application/GetSports/SportsFinderInterface'
import { GetSportsQueryResponseDto } from '~/src/modules/Activity/Application/GetSports/GetSportsQueryResponseDto'
import { SpecPayloadContractFactory } from '~/src/modules/Activity/Application/Config/Spec/SpecPayloadContractFactory'
import { CapabilityPayloadContractFactory } from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractFactory'
import { GetSportsQueryResponseDtoTranslator } from '~/src/modules/Activity/Application/GetSports/GetSportsQueryResponseDtoTranslator'

export class GetSportsQueryHandler {
  constructor(
    private readonly sportsFinder: SportsFinderInterface,
    private readonly capabilityPayloadContractFactory: CapabilityPayloadContractFactory,
    private readonly specPayloadContractFactory: SpecPayloadContractFactory,
  ) {}

  public async execute(): Promise<GetSportsQueryResponseDto> {
    const rawSports = await this.sportsFinder.find()

    return new GetSportsQueryResponseDtoTranslator(this.capabilityPayloadContractFactory, this.specPayloadContractFactory).translate({
      sports: rawSports,
      count: rawSports.length,
    })
  }
}
