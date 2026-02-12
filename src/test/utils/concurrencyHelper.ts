import { DataSource, QueryRunner } from 'typeorm'

export type Tx1Logic<T1> = (runner: QueryRunner, signalAndWait: () => Promise<void>) => Promise<T1>

export type Tx2Logic<T2> = (runner: QueryRunner, gate: Promise<void>) => Promise<T2>

export interface PessimisticLockTestOptions<T1, T2> {
  setUpData: () => Promise<void>
  dataSource: DataSource
  tx1Logic: Tx1Logic<T1>
  tx2Logic: Tx2Logic<T2>
  cleanData: () => Promise<void>
}

export async function runPessimisticLockTest<T1, T2>(options: PessimisticLockTestOptions<T1, T2>): Promise<[T1, T2]> {
  const { dataSource, tx1Logic, tx2Logic, setUpData, cleanData } = options

  await setUpData()

  const runner1 = dataSource.createQueryRunner()
  const runner2 = dataSource.createQueryRunner()

  let signalAndWait: () => Promise<void>
  const gate = new Promise<void>((resolve) => {
    signalAndWait = () => {
      resolve()
      return new Promise((res) => setTimeout(res, 500))
    }
  })

  let testError: unknown
  let results: [T1, T2]

  try {
    await Promise.all([runner1.connect(), runner2.connect()])
    await Promise.all([runner1.startTransaction(), runner2.startTransaction()])

    const transaction1 = async () => {
      return tx1Logic(runner1, signalAndWait)
    }

    const transaction2 = async () => {
      return tx2Logic(runner2, gate)
    }

    results = await Promise.all([transaction1(), transaction2()])
  } catch (exception: unknown) {
    testError = exception
  } finally {
    try {
      await Promise.all([
        runner1.isTransactionActive && runner1.rollbackTransaction(),
        runner2.isTransactionActive && runner2.rollbackTransaction(),
      ])
      await Promise.all([runner1.release(), runner2.release()])
    } catch (cleanupError) {
      console.error('CRITICAL: Failed to cleanup query runners', cleanupError)
      if (!testError) {
        testError = cleanupError
      }
    }

    try {
      await cleanData()
    } catch (cleanupError) {
      console.error('CRITICAL: Failed to clean data', cleanupError)
      if (!testError) {
        testError = cleanupError
      }
    }
  }

  if (testError) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw testError
  }

  return results!
}
