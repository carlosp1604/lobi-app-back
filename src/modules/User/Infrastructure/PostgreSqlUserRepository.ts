import { User } from '~/src/modules/User/Domain/User'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { UserModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/UserModelTranslator'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'

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

  /**
   * Finds a user by ID
   * @param id User ID
   * @param context The transactional context
   * @returns The User entity if found, otherwise null
   */
  public async findById(id: Identifier, context: TxContext): Promise<User | null> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userRepository = entityManager.getRepository(UserEntity)

    const userEntity = await userRepository.findOneBy({ id: id.value })

    if (!userEntity) {
      return null
    }

    return UserModelTranslator.toDomain(userEntity)
  }

  /**
   * Checks if a user exists by email
   * @param email UserEmail Value Object
   * @param context The transactional context
   * @returns True if the user exists, false otherwise
   */
  public async checkEmailExists(email: EmailAddress, context?: TxContext): Promise<boolean> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userRepository = entityManager.getRepository(UserEntity)

    return userRepository.existsBy({ email: email.value })
  }

  /**
   * Checks if a user exists by username
   * @param username UserUsername Value Object
   * @param context The transactional context
   * @returns True if the user exists, false otherwise
   */
  public async checkUsernameExists(username: UserUsername, context?: TxContext): Promise<boolean> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userRepository = entityManager.getRepository(UserEntity)

    return userRepository.existsBy({ username: username.value })
  }

  /**
   * Persists the given user
   * @param user User to save
   * @param context the transactional context
   */
  public async save(user: User, context?: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userRepository = entityManager.getRepository(UserEntity)

    const userRawModel = UserModelTranslator.toDatabase(user)

    await userRepository.insert(userRawModel)
  }
}
