import { DataSource, QueryRunner } from 'typeorm'

export function withTransaction(hook: (runner: QueryRunner) => void) {
  let runner: QueryRunner

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dataSource: DataSource = global.dataSource

    if (!dataSource) {
      throw new Error('global.dataSource is not defined')
    }

    runner = dataSource.createQueryRunner()
    await runner.connect()
    await runner.startTransaction()

    hook(runner)
  })

  afterEach(async () => {
    if (runner?.isTransactionActive) {
      await runner.rollbackTransaction()
    }

    if (runner && !runner.isReleased) {
      await runner.release()
    }
  })
}
