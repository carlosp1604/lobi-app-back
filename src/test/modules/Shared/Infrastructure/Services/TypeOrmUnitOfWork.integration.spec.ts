import { Test } from '@nestjs/testing'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { DataSource } from 'typeorm'

describe('TypeOrmUnitOfWork', () => {
  it('should resolve through NestJS', async () => {
    const fakeDataSource = {
      manager: {},
      createQueryRunner: jest.fn(),
    } as unknown as DataSource

    const moduleRef = await Test.createTestingModule({
      providers: [TypeOrmUnitOfWork, { provide: DataSource, useValue: fakeDataSource }],
    }).compile()

    const uow = moduleRef.get(TypeOrmUnitOfWork)
    expect(uow).toBeInstanceOf(TypeOrmUnitOfWork)
  })
})
