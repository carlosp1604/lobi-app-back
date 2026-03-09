import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { UserCredentialModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserCredentialModelTranslator'
import { UserCredentialEntity } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'

export class PostgreSqlUserCredentialRepository implements UserCredentialRepositoryInterface {
  constructor(private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Persists a new UserCredential in the database
   * @param userCredential The UserCredential domain entity to insert
   * @param context The transactional context
   */
  public async save(userCredential: UserCredential, context?: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userCredentialRepository = entityManager.getRepository(UserCredentialEntity)

    const userCredentialRawModel = UserCredentialModelTranslator.toDatabase(userCredential)

    await userCredentialRepository.insert(userCredentialRawModel)
  }

  /**
   * Updates an existing UserCredential in the database
   * @param userCredential The UserCredential domain entity to update
   * @param context The transactional context
   */
  public async update(userCredential: UserCredential, context: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userCredentialRepository = entityManager.getRepository(UserCredentialEntity)

    const userCredentialRawModel = UserCredentialModelTranslator.toDatabase(userCredential)

    await userCredentialRepository.update(userCredentialRawModel.user_id, userCredentialRawModel)
  }

  /**
   * Finds the UserCredential entity for a given user ID
   * @param userId User ID
   * @param context The transactional context
   * @returns UserCredential entity if found, otherwise null
   */
  public async findByUserId(userId: string, context?: TxContext): Promise<UserCredential | null> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userCredentialRepository = entityManager.getRepository(UserCredentialEntity)

    const userCredential = await userCredentialRepository.findOneBy({ user_id: userId })

    if (!userCredential) {
      return null
    }

    return UserCredentialModelTranslator.toDomain(userCredential)
  }
}
