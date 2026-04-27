import { Slug } from '~/src/modules/Shared/Domain/ValueObject/Slug'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ResourceUrl } from '~/src/modules/Shared/Domain/ValueObject/ResourceUrl'
import { SportParticipantsDefinition } from '~/src/modules/Activity/Domain/Sport/SportParticipantsDefinition'

export type AvailableSpec = 'participants'

export const AVAILABLE_CAPABILITIES = [
  'altitude',
  'distance',
  'duration',
  'location',
  'location_range',
  'pace',
  'ranking',
  'route',
  'rpe',
  'speed',
] as const

export type AvailableCapability = (typeof AVAILABLE_CAPABILITIES)[number]

export const isAvailableCapability = (value: string): value is AvailableCapability => {
  return AVAILABLE_CAPABILITIES.includes(value as AvailableCapability)
}

export type SportSpecsDefinition = {
  participants: SportParticipantsDefinition
}

export interface SportHydrationProps {
  id: Identifier
  slug: Slug
  imageUrl: ResourceUrl | null
  config: {
    specs: SportSpecsDefinition
    capabilities: Array<AvailableCapability>
  }
  createdAt: Date
  updatedAt: Date
}

export class Sport {
  private constructor(
    public readonly id: Identifier,
    public readonly slug: Slug,
    public readonly imageUrl: ResourceUrl | null,
    private readonly _specs: SportSpecsDefinition,
    private readonly _capabilities: Array<AvailableCapability>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public static reconstitute(props: SportHydrationProps): Sport {
    return new Sport(
      props.id,
      props.slug,
      props.imageUrl,
      props.config.specs,
      props.config.capabilities,
      props.createdAt,
      props.updatedAt,
    )
  }

  get capabilities(): Array<AvailableCapability> {
    return this._capabilities
  }

  get specs(): SportSpecsDefinition {
    return this._specs
  }
}
