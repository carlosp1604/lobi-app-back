import { Result } from '~/src/modules/Shared/Domain/Result'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { CapabilityRegistry, CapabilityTypeMap } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityRegistry'

export class CapabilityFactory {
  public safeCreate<K extends keyof CapabilityTypeMap>(
    name: K,
    props: CapabilityTypeMap[K]['input'],
  ): Result<CapabilityTypeMap[K]['instance'], ActivityDomainException> {
    return CapabilityRegistry.getConstructor(name).safeCreate(props)
  }

  public create<K extends keyof CapabilityTypeMap>(name: K, props: CapabilityTypeMap[K]['input']): CapabilityTypeMap[K]['instance'] {
    return CapabilityRegistry.getConstructor(name).create(props)
  }

  public fromPrimitives<K extends keyof CapabilityTypeMap>(
    name: K,
    primitives: CapabilityTypeMap[K]['primitives'],
  ): CapabilityTypeMap[K]['instance'] {
    return CapabilityRegistry.getConstructor(name).fromPrimitives(primitives)
  }
}
