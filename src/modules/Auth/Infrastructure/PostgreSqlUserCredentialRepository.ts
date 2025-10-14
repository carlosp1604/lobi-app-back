import { UserCredentialRepositoryInterface } from '~/src/modules/Auth/Domain/UserCredentialRepositoryInterface'
import { UserCredential } from '~/src/modules/Auth/Domain/UserCredential'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { UserCredentialModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserCredentialModelTranslator'
import { UserCredentialEntity } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'

export class PostgreSqlUserCredentialRepository implements UserCredentialRepositoryInterface {
  constructor(private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Persists the last successful login access for the given UserCredential
   * @param userCredential UserCredential to update
   * @param context the transactional context
   */
  public async saveLoginSuccess(userCredential: UserCredential, context: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userCredentialRepository = entityManager.getRepository(UserCredentialEntity)

    const { user_id, locked_until, failed_attempts, last_login_at, updated_at } =
      UserCredentialModelTranslator.toDatabase(userCredential)

    await userCredentialRepository.update(user_id, {
      locked_until,
      failed_attempts,
      last_login_at,
      updated_at,
    })
  }
}
