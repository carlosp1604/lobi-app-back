import { DataSource, EntityManager } from 'typeorm'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { TypeOrmTxContext } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

describe('TypeOrmManagerResolver', () => {
  const defaultManager = {} as unknown as EntityManager
  const transactionManager = {} as unknown as EntityManager

  const mockedDataSource = { manager: defaultManager } as unknown as DataSource

  it('should return the transaction manager when context is a TypeOrmTxContext', () => {
    const resolver = new TypeOrmManagerResolver(mockedDataSource)
    const context = new TypeOrmTxContext(transactionManager)

    const entityManager = resolver.resolve(context)

    expect(entityManager).toBe(context.manager)
  })

  it('should return the default DataSource manager when context is undefined', () => {
    const resolver = new TypeOrmManagerResolver(mockedDataSource)

    const entityManager = resolver.resolve()

    expect(entityManager).toBe(defaultManager)
  })

  it('should return the default DataSource manager when context is not a TypeOrmTxContext', () => {
    const fakeContext = {} as unknown as TxContext
    const resolver = new TypeOrmManagerResolver(mockedDataSource)

    const entityManager = resolver.resolve(fakeContext)

    expect(entityManager).toBe(defaultManager)
  })
})
