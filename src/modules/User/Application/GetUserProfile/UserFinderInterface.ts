import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { UserProfileDetailsReadModel } from '~/src/modules/User/Application/ReadModel/UserProfileDetailsReadModel'

export interface UserFinderInterface {
  /**
   * Finds a user by username
   * @param username User username
   * @returns UserProfileDetailsReadModel if found, otherwise null
   */
  findByUsername(username: UserUsername): Promise<UserProfileDetailsReadModel | null>
}
