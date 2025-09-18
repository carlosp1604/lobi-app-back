import { User } from '~/src/modules/User/Domain/User'

// type UserRepositoryRelationships = 'credentials'

export interface UserRepositoryInterface {
  /**
   * Finds a user and its credentials by email.
   * @param email User email
   * @returns the User if found, otherwise null
   */
  findByEmailWithCredentials(email: string): Promise<User>
}
