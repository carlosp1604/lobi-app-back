import { Result } from '~/src/modules/Shared/Domain/Result'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { SpecRegistry, SpecTypeMap } from '~/src/modules/Activity/Domain/Config/Spec/SpecRegistry'

export class SpecFactory {
  public safeCreate<K extends keyof SpecTypeMap>(
    name: K,
    props: SpecTypeMap[K]['input'],
  ): Result<SpecTypeMap[K]['instance'], ActivityDomainException> {
    return SpecRegistry.getConstructor(name).safeCreate(props)
  }

  public create<K extends keyof SpecTypeMap>(name: K, props: SpecTypeMap[K]['input']): SpecTypeMap[K]['instance'] {
    return SpecRegistry.getConstructor(name).create(props)
  }

  public fromPrimitives<K extends keyof SpecTypeMap>(name: K, primitives: SpecTypeMap[K]['primitives']): SpecTypeMap[K]['instance'] {
    return SpecRegistry.getConstructor(name).fromPrimitives(primitives)
  }
}
