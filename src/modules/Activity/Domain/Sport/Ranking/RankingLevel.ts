import { Translation } from '~/src/modules/Shared/Domain/Translation'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { Slug } from '~/src/modules/Shared/Domain/ValueObject/Slug'
import { ResourceUrl } from '~/src/modules/Shared/Domain/ValueObject/ResourceUrl'

export class RankingLevel {
  constructor(
    public readonly id: Identifier,
    public readonly slug: Slug,
    public readonly translations: Array<Translation>,
    public readonly imageUrl: ResourceUrl | null,
  ) {}
}
