import { User } from '~/src/modules/User/Domain/User'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UserModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/UserModelTranslator'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'

export class PostgresqlUserRepository implements UserRepositoryInterface {
  constructor(private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Finds a user by email (and acquires a pessimistic lock on the row)
   * @param email User email
   * @param context The transactional context
   * @returns The locked User entity if found, otherwise null
   */
  public async findByEmailWithLock(email: string, context?: TxContext): Promise<User | null> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userEntity = await entityManager
      .createQueryBuilder(UserEntity, 'user')
      .where('user.email = :email', { email })
      .setLock('pessimistic_write')
      .getOne()

    if (!userEntity) {
      return null
    }

    return UserModelTranslator.toDomain(userEntity)
  }

  /**
   * Finds a user by email
   * @param email User email
   * @param context The transactional context
   * @returns The User entity if found, otherwise null
   */
  public async findByEmail(email: string, context?: TxContext): Promise<User | null> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userRepository = entityManager.getRepository(UserEntity)

    const userEntity = await userRepository.findOneBy({ email })

    if (!userEntity) {
      return null
    }

    return UserModelTranslator.toDomain(userEntity)
  }

  /**
   * Finds a user by ID (and acquires a pessimistic lock on the row)
   * @param id User ID
   * @param context The transactional context
   * @returns The locked User entity if found, otherwise null
   */
  public async findByIdWithLock(id: string, context: TxContext): Promise<User | null> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userEntity = await entityManager
      .createQueryBuilder(UserEntity, 'user')
      .where('user.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne()

    if (!userEntity) {
      return null
    }

    return UserModelTranslator.toDomain(userEntity)
  }
}
