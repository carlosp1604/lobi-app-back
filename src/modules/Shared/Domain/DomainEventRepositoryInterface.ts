import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

export interface DomainEventRepositoryInterface {
  /**
   * Persists the given domain event
   * @param domainEvent DomainEvent to save
   * @param context the transactional context
   */
  save(domainEvent: DomainEvent, context: TxContext): Promise<void>
}
