import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { Inject, Injectable } from '@nestjs/common'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { UserSessionModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/UserSessionModelTranslator'
import { UserSessionEntity } from '~/src/modules/Auth/Infrastructure/Entities/UserSession.entity'

@Injectable()
export class PostgreSqlUserSessionRepository implements UserSessionRepositoryInterface {
  constructor(@Inject() private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Persists the given user session
   * @param userSession the session to save
   * @param context the transactional context
   */
  public async save(userSession: UserSession, context: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const userSessionRepository = entityManager.getRepository(UserSessionEntity)

    const userSessionRawModel = UserSessionModelTranslator.toDatabase(userSession)

    await userSessionRepository.save(userSessionRawModel)
  }

  /**
   * Revokes the oldest sessions for the given user until the number
   * of active sessions does not exceed the specified maximum
   * @param userId User ID
   * @param maxSessions the maximum allowed number of active sessions
   * @param context the transactional context
   * @returns a promise that resolves when the sessions have been revoked
   */
  public async revokeOldest(userId: string, maxSessions: number, context: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    await entityManager.query(
      `
      WITH active AS (
        SELECT id, created_at
        FROM user_sessions
        WHERE user_id = $1
          AND revoked_at IS NULL
          AND expires_at > NOW()
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      ), numbered AS (
        SELECT id, row_number() OVER (ORDER BY created_at) AS rn, count(*) OVER () AS cnt
        FROM active
      ), to_revoke AS (
        SELECT id
        FROM numbered
        WHERE rn <= GREATEST(cnt - ($2 - 1), 0)
      )
      UPDATE user_sessions s
      SET revoked_at = NOW(), updated_at = NOW()
      FROM to_revoke tr
      WHERE s.id = tr.id;
    `,
      [userId, maxSessions],
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
      .where('s.user_id = :uid', { uid: userSessionRawModel.id })
      .andWhere('s.revoked_at IS NULL')
      .andWhere('s.expires_at > NOW()')

    if (userSessionRawModel.ip_hash) {
      queryBuilder
        .andWhere('s.ip_hash = :ipHash', { ipHash: userSessionRawModel.ip_hash })
        .andWhere('s.user_agent = :user_agent', { user_agent_id: userSessionRawModel.user_agent })
    } else {
      queryBuilder.andWhere('s.ip_hash IS NULL')
      queryBuilder.andWhere('s.user_agent = :ua', { ua: userSessionRawModel.user_agent })
    }

    queryBuilder.limit(1)

    const row = await queryBuilder.getRawOne<unknown>()
    return !!row
  }
}
