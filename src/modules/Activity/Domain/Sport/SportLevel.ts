import { Slug } from '~/src/modules/Shared/Domain/ValueObject/Slug'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ResourceUrl } from '~/src/modules/Shared/Domain/ValueObject/ResourceUrl'

export class SportLevel {
  public constructor(
    public readonly id: Identifier,
    public readonly slug: Slug,
    public readonly order: number,
    public readonly imageUrl: ResourceUrl | null,
  ) {}
}
