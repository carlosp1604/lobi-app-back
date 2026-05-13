import { Result } from '~/src/modules/Shared/Domain/Result'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'

export interface CapabilityInterface<P> extends SerializableInterface<P> {
  toPrimitives(): P
  equals(capability?: CapabilityInterface<P> | null): boolean
}

export interface CapabilityClass<T extends CapabilityInterface<P>, I, P> {
  readonly capabilityName: AvailableCapability

  safeCreate(props: I): Result<T, ActivityDomainException>
  create(props: I): T
  fromPrimitives(primitives: P): T
}
