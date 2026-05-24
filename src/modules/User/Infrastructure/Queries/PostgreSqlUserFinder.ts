import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { EntityManager } from 'typeorm'
import { UserFinderInterface } from '~/src/modules/User/Application/GetUserProfile/UserFinderInterface'
import {
  UserProfileDetailsReadModel,
  UserProfileDetailsWithoutImageUrlReadModel,
} from '~/src/modules/User/Application/ReadModel/UserProfileDetailsReadModel'

export class PostgreSqlUserFinder implements UserFinderInterface {
  constructor(private readonly entityManager: EntityManager) {}

  /**
   * Finds a user by username
   * @param username User username
   * @returns UserProfileDetailsReadModel if found, otherwise null
   */
  public async findByUsername(username: UserUsername): Promise<UserProfileDetailsReadModel | null> {
    const rawUsername = username.value

    const rawResult = await this.entityManager.query<Array<UserProfileDetailsWithoutImageUrlReadModel>>(
      `
        SELECT
          u.id,
          u.name,
          u.username,
          u.created_at,
          sp.bio,
          sp.birth_date
        FROM users u
        INNER JOIN sportsman_profiles sp ON u.id = sp.user_id
        WHERE u.username = $1 AND u.deleted_at IS NULL AND u.status = 'active'
      `,
      [rawUsername],
    )

    if (!rawResult || rawResult.length === 0) {
      return null
    }

    const row = rawResult[0]

    return {
      ...row,
      image_url: null,
    }
  }
}
