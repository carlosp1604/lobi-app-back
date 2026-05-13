import { Result } from '~/src/modules/Shared/Domain/Result'
import { AvailableSpec } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'

export interface SpecInterface<P> extends SerializableInterface<P> {
  toPrimitives(): P
  equals(spec?: SpecInterface<P> | null): boolean
}

export interface SpecClass<T extends SpecInterface<P>, I, P> {
  readonly specName: AvailableSpec

  safeCreate(props: I): Result<T, ActivityDomainException>
  create(props: I): T
  fromPrimitives(primitives: P): T
}
