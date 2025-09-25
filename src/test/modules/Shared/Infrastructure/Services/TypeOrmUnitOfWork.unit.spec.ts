/* eslint @typescript-eslint/unbound-method: 0 */
import { DataSource, EntityManager, QueryRunner } from 'typeorm'
import { TypeOrmTxContext, TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { mock, MockProxy, mockReset } from 'jest-mock-extended'

describe('TypeOrmUnitOfWork', () => {
  describe('happy path', () => {
    const mockedRunner: MockProxy<QueryRunner> = mock<QueryRunner>({
      manager: {} as unknown as EntityManager,
    })

    const mockedDataSource = mock<DataSource>({
      manager: {} as unknown as EntityManager,
    })

    beforeEach(() => {
      mockReset(mockedRunner)
      mockReset(mockedDataSource)

      mockedRunner.connect.mockResolvedValueOnce(undefined)
      mockedRunner.startTransaction.mockResolvedValueOnce(undefined)
      mockedRunner.commitTransaction.mockResolvedValueOnce(undefined)
      mockedRunner.rollbackTransaction.mockResolvedValueOnce(undefined)
      mockedRunner.release.mockResolvedValueOnce(undefined)
      mockedDataSource.createQueryRunner.mockReturnValue(mockedRunner)
    })

    it('should connect execute a transaction correctly', async () => {
      const uow = new TypeOrmUnitOfWork(mockedDataSource)

      const result = await uow.runInTransaction(async (ctx) => {
        expect(ctx).toBeInstanceOf(TypeOrmTxContext)
        expect((ctx as TypeOrmTxContext).manager).toBe(mockedRunner.manager)
        return Promise.resolve('ok')
      })

      expect(result).toBe('ok')
      expect(mockedDataSource.createQueryRunner).toHaveBeenCalledTimes(1)
      expect(mockedRunner.connect).toHaveBeenCalledTimes(1)
      expect(mockedRunner.startTransaction).toHaveBeenCalledTimes(1)
      expect(mockedRunner.commitTransaction).toHaveBeenCalledTimes(1)
      expect(mockedRunner.rollbackTransaction).not.toHaveBeenCalled()
      expect(mockedRunner.release).toHaveBeenCalledTimes(1)
    })
  })

  describe('when there are errors', () => {
    const mockedRunner: MockProxy<QueryRunner> = mock<QueryRunner>({
      manager: {} as unknown as EntityManager,
    })

    const mockedDataSource = mock<DataSource>({
      manager: {} as unknown as EntityManager,
    })

    beforeEach(() => {
      mockReset(mockedRunner)
      mockReset(mockedDataSource)

      mockedRunner.connect.mockResolvedValueOnce(undefined)
      mockedRunner.startTransaction.mockResolvedValueOnce(undefined)
      mockedRunner.release.mockResolvedValueOnce(undefined)
      mockedDataSource.createQueryRunner.mockReturnValue(mockedRunner)
    })

    it('should rollback and throw an exception if work throws', async () => {
      mockedRunner.rollbackTransaction.mockResolvedValueOnce(undefined)

      const uow = new TypeOrmUnitOfWork(mockedDataSource)

      await expect(
        uow.runInTransaction(async () => {
          await Promise.reject(Error('Unexpected work error'))
        }),
      ).rejects.toStrictEqual(new Error('Unexpected work error'))

      expect(mockedRunner.connect).toHaveBeenCalled()
      expect(mockedRunner.startTransaction).toHaveBeenCalled()
      expect(mockedRunner.commitTransaction).not.toHaveBeenCalled()
      expect(mockedRunner.rollbackTransaction).toHaveBeenCalledTimes(1)
      expect(mockedRunner.release).toHaveBeenCalledTimes(1)
    })

    it('should rollback and throw an exception if commit fails', async () => {
      mockedRunner.commitTransaction.mockRejectedValueOnce(new Error('Unexpected commit error'))
      mockedRunner.rollbackTransaction.mockResolvedValueOnce(undefined)

      const uow = new TypeOrmUnitOfWork(mockedDataSource)

      await expect(uow.runInTransaction(async () => Promise.resolve('ok'))).rejects.toThrow(Error('Unexpected commit error'))

      expect(mockedRunner.rollbackTransaction).toHaveBeenCalledTimes(1)
      expect(mockedRunner.release).toHaveBeenCalledTimes(1)
    })

    it('should throw exception if rollback fails', async () => {
      mockedRunner.rollbackTransaction.mockRejectedValueOnce(new Error('Unexpected rollback error'))

      const uow = new TypeOrmUnitOfWork(mockedDataSource)

      await expect(
        uow.runInTransaction(async () => {
          await Promise.reject(Error('Unexpected work error'))
        }),
      ).rejects.toStrictEqual(new Error('Unexpected work error'))

      expect(mockedRunner.rollbackTransaction).toHaveBeenCalledTimes(1)
      expect(mockedRunner.release).toHaveBeenCalledTimes(1)
    })

    it('should not throw error if release fails', async () => {
      mockedRunner.commitTransaction.mockResolvedValueOnce(undefined)
      mockedRunner.release.mockRejectedValueOnce(new Error('Unexpected rollback error'))

      const uow = new TypeOrmUnitOfWork(mockedDataSource)

      await expect(uow.runInTransaction(async () => Promise.resolve('ok'))).resolves.toBe('ok')

      expect(mockedRunner.commitTransaction).toHaveBeenCalled()
      expect(mockedRunner.release).toHaveBeenCalled()
    })
  })

  describe('getManagerFrom', () => {
    const mockedRunner: MockProxy<QueryRunner> = mock<QueryRunner>({
      manager: {} as unknown as EntityManager,
    })

    const mockedDataSource = mock<DataSource>({
      manager: {} as unknown as EntityManager,
    })

    beforeEach(() => {
      mockReset(mockedRunner)
      mockReset(mockedDataSource)
    })

    it('should return manager from context if it is TypeOrmTxContext', () => {
      const uow = new TypeOrmUnitOfWork(mockedDataSource)

      const context = new TypeOrmTxContext(mockedRunner.manager)
      expect(uow.getManagerFrom(context)).toBe(mockedRunner.manager)
    })

    it('should return manager from dataSource.manager if it is not TypeOrmTxContext', () => {
      const uow = new TypeOrmUnitOfWork(mockedDataSource)

      expect(uow.getManagerFrom()).toBe(mockedDataSource.manager)
      expect(uow.getManagerFrom({} as any)).toBe(mockedDataSource.manager)
    })
  })
})
