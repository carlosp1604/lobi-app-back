import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { UserSessionModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserSessionModelTranslator'
import { UserSessionEntity } from '~/src/modules/Auth/Infrastructure/Entities/UserSession.entity'

export class PostgreSqlUserSessionRepository implements UserSessionRepositoryInterface {
  constructor(private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Persists the given user session
   * @param userSession the session to save
   * @param context the transactional context
   */
  public async save(userSession: UserSession, context: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userSessionRepository = entityManager.getRepository(UserSessionEntity)

    const userSessionRawModel = UserSessionModelTranslator.toDatabase(userSession)

    await userSessionRepository.insert(userSessionRawModel)
  }

  /**
   * Revokes the oldest sessions for the given user (if necessary) and
   * persists the given new session atomically, ensuring the maximum number
   * of active sessions is not exceeded.
   *
   * @param userSession the new session to insert
   * @param maxSessions the maximum allowed number of active sessions (including this new one)
   * @param context the transactional context
   * @returns a promise that resolves with the number of sessions revoked and the id of the inserted session
   */
  public async revokeOldestAndSave(userSession: UserSession, maxSessions: number, context: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userSessionRawModel = UserSessionModelTranslator.toDatabase(userSession)

    const params = [
      userSessionRawModel.user_id,
      maxSessions,
      userSessionRawModel.id,
      userSessionRawModel.token_hash,
      userSessionRawModel.expires_at,
      userSessionRawModel.ip_hash,
      userSessionRawModel.user_agent,
      userSessionRawModel.device_country,
      userSessionRawModel.device_city,
      userSessionRawModel.device_timezone,
    ]

    await entityManager.query(
      `
        WITH lock AS (SELECT pg_advisory_xact_lock(hashtextextended(($1::uuid)::text, 0))), active AS (
          SELECT id, created_at
          FROM user_sessions
          WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
          ORDER BY created_at ASC
          FOR UPDATE
        ), numbered AS (
          SELECT id, row_number() OVER (ORDER BY created_at) AS rn, count(*) OVER () AS cnt
          FROM active
        ), to_revoke AS (
          SELECT id
          FROM numbered
          WHERE rn <= GREATEST(cnt - ($2 - 1), 0)
        ), revoked AS (
          UPDATE user_sessions s
          SET revoked_at = NOW(), updated_at = NOW()
          FROM to_revoke tr
          WHERE s.id = tr.id
          RETURNING s.id
        ), inserted AS (
          INSERT INTO user_sessions
          (id, user_id, token_hash, expires_at, ip_hash, user_agent,
          device_country, device_city, device_timezone, created_at, updated_at)
          VALUES
          ($3, $1, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          RETURNING id
        )
        SELECT
          (SELECT count(*) FROM revoked) AS revoked_count,
          (SELECT id FROM inserted) AS session_id;
      `,
      params,
    )
  }

  /**
   * Checks whether a session already exists for the given device
   * @param userSession the session containing device information
   * @returns true if a session for the device exists, otherwise false
   */
  public async existsDevice(userSession: UserSession): Promise<boolean> {
    const entityManager = this.entityManagerResolver.resolve()

    const userSessionRepository = entityManager.getRepository(UserSessionEntity)

    const userSessionRawModel = UserSessionModelTranslator.toDatabase(userSession)

    const queryBuilder = userSessionRepository
      .createQueryBuilder('s')
      .select('1')
      .where('s.user_id = :user_id', { user_id: userSessionRawModel.user_id })
      .andWhere('s.revoked_at IS NULL')
      .andWhere('s.expires_at > NOW()')

    if (userSessionRawModel.ip_hash) {
      queryBuilder
        .andWhere('s.ip_hash = :ip_hash', { ip_hash: userSessionRawModel.ip_hash })
        .andWhere('s.user_agent = :user_agent', { user_agent: userSessionRawModel.user_agent })
    } else {
      queryBuilder.andWhere('s.ip_hash IS NULL')
      queryBuilder.andWhere('s.user_agent = :user_agent', { user_agent: userSessionRawModel.user_agent })
    }

    queryBuilder.limit(1)

    const row = await queryBuilder.getRawOne<unknown>()
    return !!row
  }
}
