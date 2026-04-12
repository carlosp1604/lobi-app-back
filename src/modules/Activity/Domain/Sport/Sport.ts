import { Slug } from '~/src/modules/Shared/Domain/ValueObject/Slug'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ResourceUrl } from '~/src/modules/Shared/Domain/ValueObject/ResourceUrl'
import { Translation } from '~/src/modules/Shared/Domain/Translation'
import { SportSpecInterface } from './SportRegistry/Specs/SportSpecInterface'
import { ValidSportModality } from '~/src/modules/Activity/Domain/Sport/SportRegistry/SportRegistry'
import { SportBaseCapability } from './SportRegistry/Capabilities/SportBaseCapability'

export interface SportHydrationProps {
  id: Identifier
  slug: Slug
  modality: ValidSportModality
  translations: Array<Translation>
  imageUrl: ResourceUrl | null
  specs: Array<SportSpecInterface<unknown>>
  capabilities: Array<SportBaseCapability<unknown, unknown>>
}

export class Sport {
  private constructor(
    public readonly id: Identifier,
    public readonly slug: Slug,
    public readonly modality: ValidSportModality,
    public readonly translations: Array<Translation>,
    public readonly imageUrl: ResourceUrl | null,
    private readonly specs: Map<string, SportSpecInterface<unknown>>,
    private readonly capabilities: Map<string, SportBaseCapability<unknown, unknown>>,
  ) {}

  public static hydrate(props: SportHydrationProps): Sport {
    const specsMap = new Map(props.specs.map((spec) => [spec.specName, spec]))
    const capabilitiesMap = new Map(props.capabilities.map((cap) => [cap.capabilityName, cap]))

    return new Sport(props.id, props.slug, props.modality, props.translations, props.imageUrl, specsMap, capabilitiesMap)
  }

  // TODO: Implement when specs and capabilities support toDTO method
  public toDTO(): Record<string, unknown> {
    const specsDTO: Record<string, unknown> = {}
    this.specs.forEach((spec, key) => {
      specsDTO[key] = '' // spec.toDTO()
    })

    const capabilitiesDTO: Record<string, unknown> = {}
    this.capabilities.forEach((cap, key) => {
      capabilitiesDTO[key] = '' // cap.toDTO()
    })

    return {
      id: this.id.value,
      slug: this.slug,
      translations: this.translations,
      imageUrl: this.imageUrl ? this.imageUrl.value : null,
      modality: this.modality,
      specs: specsDTO,
      capabilities: capabilitiesDTO,
    }
  }
}
