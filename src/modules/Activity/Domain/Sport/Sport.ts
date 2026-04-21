import { Slug } from '~/src/modules/Shared/Domain/ValueObject/Slug'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ResourceUrl } from '~/src/modules/Shared/Domain/ValueObject/ResourceUrl'
import { SportBaseSpec } from '~/src/modules/Activity/Domain/Sport/SportRegistry/Specs/SportBaseSpec'
import { ValidSportModality } from '~/src/modules/Activity/Domain/Sport/SportRegistry/SportRegistry'
import { SportBaseCapability } from './SportRegistry/Capabilities/SportBaseCapability'

export interface SportHydrationProps {
  id: Identifier
  slug: Slug
  modality: ValidSportModality
  imageUrl: ResourceUrl | null
  specs: Array<SportBaseSpec<unknown, unknown>>
  capabilities: Array<SportBaseCapability<unknown, unknown>>
}

export class Sport {
  private constructor(
    public readonly id: Identifier,
    public readonly slug: Slug,
    public readonly modality: ValidSportModality,
    public readonly imageUrl: ResourceUrl | null,
    private readonly _specs: Map<string, SportBaseSpec<unknown, unknown>>,
    private readonly _capabilities: Map<string, SportBaseCapability<unknown, unknown>>,
  ) {}

  public static hydrate(props: SportHydrationProps): Sport {
    const specsMap = new Map(props.specs.map((spec) => [spec.specName, spec]))
    const capabilitiesMap = new Map(props.capabilities.map((cap) => [cap.capabilityName, cap]))

    return new Sport(props.id, props.slug, props.modality, props.imageUrl, specsMap, capabilitiesMap)
  }

  get capabilities(): Array<SportBaseCapability<unknown, unknown>> {
    return Array.from(this._capabilities.values())
  }

  get specs(): Array<SportBaseSpec<unknown, unknown>> {
    return Array.from(this._specs.values())
  }
}
