import { SportRepositoryInterface } from '~/src/modules/Activity/Domain/Sport/SportRepositoryInterface'
import { SportApplicationDtoTranslator } from '~/src/modules/Activity/Application/Translator/SportApplicationDtoTranslator'
import { GetSportsApplicationResponseDto } from '~/src/modules/Activity/Application/GetSports/GetSportsApplicationResponseDto'

export class GetSports {
  constructor(private readonly sportRepository: SportRepositoryInterface) {}

  public async execute(): Promise<GetSportsApplicationResponseDto> {
    const sportsWithCount = await this.sportRepository.getAll()

    return {
      sports: sportsWithCount.sports.map((sport) => new SportApplicationDtoTranslator().translate(sport)),
      count: sportsWithCount.count,
    }
  }
}
