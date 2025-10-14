import { EntityManager, QueryRunner, DataSource } from 'typeorm'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'

export class TypeOrmTxContext implements TxContext {
  readonly __opaque_tx_context = true
  constructor(public readonly manager: EntityManager) {}
}

export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  public async runInTransaction<T>(work: (context: TxContext) => Promise<T>): Promise<T> {
    const runner: QueryRunner = this.dataSource.createQueryRunner()
    await runner.connect()
    await runner.startTransaction()

    try {
      const ctx = new TypeOrmTxContext(runner.manager)
      const result = await work(ctx)
      await runner.commitTransaction()
      return result
    } catch (exception: unknown) {
      await runner.rollbackTransaction().catch(() => {})
      throw exception
    } finally {
      try {
        await runner.release()
      } catch {
        /* empty */
      }
    }
  }

  public getManagerFrom(context?: TxContext): EntityManager {
    if (context instanceof TypeOrmTxContext) {
      return context.manager
    }

    return this.dataSource.manager
  }
}
