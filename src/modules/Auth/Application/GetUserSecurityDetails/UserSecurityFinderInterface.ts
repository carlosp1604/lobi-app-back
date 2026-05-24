import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UserSecurityDetailsReadModel } from '~/src/modules/Auth/Application/ReadModel/UserSecurityDetailsReadModel'

export interface UserSecurityFinderInterface {
  /**
   * Finds a user's security details given its ID
   * @param userId User ID
   * @param now Clock to determine whether a session is active or not
   * @returns UserSecurityDetailsReadModel if found, otherwise null
   */
  findDetails(userId: Identifier, now: Date): Promise<UserSecurityDetailsReadModel | null>
}
