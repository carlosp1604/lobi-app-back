import { TxContext } from '~/src/modules/Shared/Application/TxContext'

export interface UnitOfWork {
  /**
   * Executes the given work inside a transactional context
   * @param work a function that receives the transactional context (TxContext) to be used in the transaction
   * @returns the result of the work function
   * @throws an error if the transaction fails
   */
  runInTransaction<T>(work: (context: TxContext) => Promise<T>): Promise<T>
}
