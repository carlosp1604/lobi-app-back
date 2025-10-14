import { DataSource, EntityManager } from 'typeorm'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'

export class TypeOrmManagerResolver {
  constructor(private readonly dataSource: DataSource) {}

  resolve(context?: TxContext): EntityManager {
    return context instanceof TypeOrmTxContext ? context.manager : this.dataSource.manager
  }
}
