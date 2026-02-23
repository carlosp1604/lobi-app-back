import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { DomainEventRawModel } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'

export const makeRawDomainEvent = (overrides: Partial<DomainEventRawModel> = {}): DomainEventRawModel => {
  const now = new Date()

  return {
    id: overrides.id ?? IdentifierMother.valid().toString(),
    name: overrides.name ?? DomainEventName.successfulLogin().toString(),
    aggregate_id: overrides.aggregate_id ?? IdentifierMother.valid().toString(),
    aggregate_type: overrides.aggregate_type ?? DomainEventAggregateType.user().toString(),
    occurred_at: overrides.occurred_at ?? now,
    metadata: overrides.metadata ?? { arguments: 1, result: 'ok', property: null },
    payload: overrides.payload ?? { info: 'info', date: now },
    version: overrides.version ?? 1,
  }
}
