import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { EntityManager } from 'typeorm'
import { UserSecurityFinderInterface } from '~/src/modules/Auth/Application/GetUserSecurityDetails/UserSecurityFinderInterface'
import { UserSecurityDetailsReadModel } from '~/src/modules/Auth/Application/ReadModel/UserSecurityDetailsReadModel'

export class PostgreSqlUserSecurityFinder implements UserSecurityFinderInterface {
  constructor(private readonly entityManager: EntityManager) {}

  /**
   * Finds a user's security details given its ID
   * @param userId User ID
   * @param now Clock to determine whether a session is active or not
   * @returns UserSecurityDetailsReadModel if found, otherwise null
   */
  public async findDetails(userId: Identifier, now: Date): Promise<UserSecurityDetailsReadModel | null> {
    const rawResult = await this.entityManager.query<Array<UserSecurityDetailsReadModel>>(
      `
        SELECT
          json_build_object(
            'created_at', uc.created_at,
            'updated_at', uc.updated_at
          ) AS credential,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', us.id,
                  'device_country_code', us.device_country_code,
                  'device_city', us.device_city,
                  'created_at', us.created_at,
                  'device_info', us.device_info,
                  'expires_at', us.expires_at
                )
                ORDER BY us.created_at DESC
              )
              FROM user_sessions us
              WHERE us.user_id = u.id
                AND us.expires_at > $2
                AND us.revoked_at IS NULL
            ),
            '[]'::json
          ) AS sessions
        FROM users u
        INNER JOIN user_credentials uc ON u.id = uc.user_id
        WHERE u.id = $1
          AND u.status = 'active'
          AND u.deleted_at IS NULL
        LIMIT 1;
      `,
      [userId.value, now],
    )

    if (!rawResult || rawResult.length === 0) {
      return null
    }

    return rawResult[0]
  }
}
