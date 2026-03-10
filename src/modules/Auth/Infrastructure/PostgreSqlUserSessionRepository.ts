import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { UserSessionModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserSessionModelTranslator'
import { UserSessionEntity } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'
import { IsNull, MoreThan } from 'typeorm'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'

export class PostgreSqlUserSessionRepository implements UserSessionRepositoryInterface {
  constructor(private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Persists multiple UserSessions
   * @param userSessions The array of sessions to save
   * @param context The transactional context
   */
  public async save(userSessions: Array<UserSession>, context: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userSessionRepository = entityManager.getRepository(UserSessionEntity)

    const userSessionRawModels = userSessions.map((userSession) => UserSessionModelTranslator.toDatabase(userSession))

    await userSessionRepository.save(userSessionRawModels)
  }

  /**
   * Finds all active (non-revoked and non-expired) sessions for a given user
   * @param userId User ID
   * @param now The current date and time
   * @param context The transactional context
   * @returns Array of active UserSession
   */
  public async findUserActiveSessions(userId: string, now: Date, context?: TxContext): Promise<Array<UserSession>> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userSessionRepository = entityManager.getRepository(UserSessionEntity)

    const activeSessions = await userSessionRepository.findBy({
      user_id: userId,
      revoked_at: IsNull(),
      expires_at: MoreThan(now),
    })

    return activeSessions.map((userSessionRawModel) => UserSessionModelTranslator.toDomain(userSessionRawModel))
  }

  /**
   * Finds a UserSession by its token hash
   * @param hash The unique hash of the session token
   * @param context The transactional context
   * @returns The UserSession if found, otherwise null
   */
  public async findByHash(hash: string, context: TxContext): Promise<UserSession | null> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userSessionRepository = entityManager.getRepository(UserSessionEntity)

    const userSessionEntity = await userSessionRepository.findOneBy({ token_hash: hash })

    if (!userSessionEntity) {
      return null
    }

    return UserSessionModelTranslator.toDomain(userSessionEntity)
  }

  /**
   * Finds a UserSession by ID
   * @param id UserSession ID
   * @param context The transactional context
   * @returns The UserSession if found, otherwise null
   */
  public async findById(id: Identifier, context: TxContext): Promise<UserSession | null> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userSessionRepository = entityManager.getRepository(UserSessionEntity)

    const userSessionEntity = await userSessionRepository.findOneBy({ id: id.value })

    if (!userSessionEntity) {
      return null
    }

    return UserSessionModelTranslator.toDomain(userSessionEntity)
  }
}
