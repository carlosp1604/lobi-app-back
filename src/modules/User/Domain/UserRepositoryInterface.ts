import { User } from '~/src/modules/User/Domain/User'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'

export interface UserRepositoryInterface {
  /**
   * Finds a user by email (and acquires a pessimistic lock on the row)
   * @param email User email
   * @param context The transactional context
   * @returns The locked User entity if found, otherwise null
   */
  findByEmailWithLock(email: string, context?: TxContext): Promise<User | null>

  /**
   * Finds a user by email
   * @param email User email
   * @param context The transactional context
   * @returns The User entity if found, otherwise null
   */
  findByEmail(email: string, context?: TxContext): Promise<User | null>

  /**
   * Finds a user by ID (and acquires a pessimistic lock on the row)
   * @param id User ID
   * @param context The transactional context
   * @returns The locked User entity if found, otherwise null
   */
  findByIdWithLock(id: string, context: TxContext): Promise<User | null>

  /**
   * Checks if a user exists by email
   * @param email UserEmail Value Object
   * @param context The transactional context
   * @returns True if the user exists, false otherwise
   */
  checkEmailExists(email: EmailAddress, context?: TxContext): Promise<boolean>

  /**
   * Checks if a user exists by username
   * @param username UserUsername Value Object
   * @param context The transactional context
   * @returns True if the user exists, false otherwise
   */
  checkUsernameExists(username: UserUsername, context?: TxContext): Promise<boolean>

  /**
   * Persists the given user
   * @param user User to save
   * @param context the transactional context
   */
  save(user: User, context?: TxContext): Promise<void>
}
