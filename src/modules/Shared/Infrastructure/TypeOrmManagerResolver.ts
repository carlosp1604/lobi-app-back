import { DataSource, EntityManager } from 'typeorm'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'

export class TypeOrmManagerResolver {
  constructor(private readonly ds: DataSource) {}

  resolve(context?: TxContext): EntityManager {
    return context instanceof TypeOrmTxContext ? context.manager : this.ds.manager
  }
}
