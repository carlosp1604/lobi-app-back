import { User } from '~/src/modules/User/Domain/User'

export type UserRepositoryRelationships = 'credential'

export interface UserRepositoryInterface {
  /**
   * Finds a user and its credentials by email.
   * @param email User email
   * @returns the User if found, otherwise null
   */
  findByEmailWithCredentials(email: string): Promise<User | null>
}
