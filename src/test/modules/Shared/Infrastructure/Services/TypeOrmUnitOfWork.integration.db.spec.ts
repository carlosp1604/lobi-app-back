import 'reflect-metadata'
import { DataSource, EntityManager } from 'typeorm'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { makeRawUserCredential } from '~/src/test/modules/Auth/Infrastructure/UserCredentialRawTestMaker'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UserCredentialEntity } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
import { TypeOrmUnitOfWork } from '~/src/modules/Shared/Infrastructure/TypeOrmUnitOfWork'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

describe('TypeOrmUnitOfWork', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const dataSource: DataSource = global.dataSource
  let uow: TypeOrmUnitOfWork

  beforeEach(async () => {
    uow = new TypeOrmUnitOfWork(dataSource)

    await dataSource.query('DELETE FROM user_credentials')
    await dataSource.query('DELETE FROM users')
  })

  const findUser = async () => {
    const foundUser = await dataSource.getRepository(UserEntity).findOneBy({
      id: userId.toString(),
    })

    return foundUser !== null
  }

  const findCredential = async () => {
    const foundUserCredential = await dataSource.getRepository(UserEntity).findOneBy({
      id: userId.toString(),
    })

    return foundUserCredential !== null
  }

  const userId = UserIdMother.valid()
  const rawUser = makeRawUser({
    id: userId.toString(),
  })

  const rawUserCredential = makeRawUserCredential({
    user_id: userId.toString(),
  })

  it('should insert a new user and its credential in the same transaction', async () => {
    const userExists = await findUser()
    const userCredentialExists = await findCredential()

    expect(userExists).toBe(false)
    expect(userCredentialExists).toBe(false)

    await expect(
      uow.runInTransaction(async (ctx: TxContext) => {
        const userRepository = ((ctx as any).manager as EntityManager).getRepository(UserEntity)
        const userCredentialRepository = ((ctx as any).manager as EntityManager).getRepository(UserCredentialEntity)

        await userRepository.save(rawUser)
        await userCredentialRepository.save(rawUserCredential)

        return 'ok'
      }),
    ).resolves.toBe('ok')

    const userExistsAfterUoW = await findUser()
    const userCredentialExistsAfterUoW = await findCredential()
    expect(userExistsAfterUoW).toBe(true)
    expect(userCredentialExistsAfterUoW).toBe(true)
  })

  it('should rollback if something fails inside the transaction', async () => {
    const userExists = await findUser()
    const userCredentialExists = await findCredential()

    expect(userExists).toBe(false)
    expect(userCredentialExists).toBe(false)

    await expect(
      uow.runInTransaction(async (ctx: TxContext) => {
        const userRepository = ((ctx as any).manager as EntityManager).getRepository(UserEntity)

        await userRepository.save(rawUser)
        throw new Error('Something went wrong')
      }),
    ).rejects.toThrow(Error('Something went wrong'))

    const userExistsAfterUoW = await findUser()
    const userCredentialExistsAfterUoW = await findCredential()
    expect(userExistsAfterUoW).toBe(false)
    expect(userCredentialExistsAfterUoW).toBe(false)
  })
})
