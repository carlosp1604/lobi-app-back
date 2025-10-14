import { DomainEventRawModel } from '~/src/modules/Shared/Infrastructure/Entities/domain-event.entity'
import { DomainEventIdMother } from '~/src/test/mothers/DomainEventIdMother'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateIdMother } from '~/src/test/mothers/DomainEventAggregateIdMother'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'

export const makeRawDomainEvent = (overrides: Partial<DomainEventRawModel> = {}): DomainEventRawModel => {
  const now = new Date()

  return {
    id: overrides.id ?? DomainEventIdMother.valid().toString(),
    name: overrides.name ?? DomainEventName.successfulLogin().toString(),
    aggregate_id: overrides.aggregate_id ?? DomainEventAggregateIdMother.valid().toString(),
    aggregate_type: overrides.aggregate_type ?? DomainEventAggregateType.user().toString(),
    occurred_at: overrides.occurred_at ?? now,
    metadata: overrides.metadata ?? { arguments: 1, result: 'ok', property: null },
    payload: overrides.payload ?? { info: 'info', date: now },
    version: overrides.version ?? 1,
  }
}
