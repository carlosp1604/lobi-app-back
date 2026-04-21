import { Slug } from '~/src/modules/Shared/Domain/ValueObject/Slug'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ResourceUrl } from '~/src/modules/Shared/Domain/ValueObject/ResourceUrl'
import { SportRankingSystem } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Ranking/SportRankingSystem'

const rankingData = [
  { id: '47952670-3502-498c-8594-52623e198642', slug: 'beginner', order: 1, imageUrl: null },
  { id: '829497e6-8176-4768-a28d-192562479e9a', slug: 'intermediate', order: 2, imageUrl: null },
  { id: '1692138a-3642-49d7-8d26-77884849208a', slug: 'advanced', order: 3, imageUrl: null },
  { id: '9f041772-2371-460d-9b59-786524312891', slug: 'professional', order: 4, imageUrl: null },
]

export const BasicSportRankingSystem: Array<SportRankingSystem> = rankingData.map(
  (data) =>
    new SportRankingSystem(
      Identifier.fromString(data.id),
      Slug.fromString(data.slug),
      data.order,
      data.imageUrl ? ResourceUrl.fromString(data.imageUrl) : null,
    ),
)
