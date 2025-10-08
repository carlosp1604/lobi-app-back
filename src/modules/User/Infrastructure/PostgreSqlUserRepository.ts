import { User } from '~/src/modules/User/Domain/User'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UserModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/UserModelTranslator'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'

export class PostgresqlUserRepository implements UserRepositoryInterface {
  constructor(private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Finds a user and its credentials by email.
   * @param email User email
   * @returns the User if found, otherwise null
   */
  public async findByEmailWithCredentials(email: string): Promise<User | null> {
    const entityManager = this.entityManagerResolver.resolve()

    const userRepository = entityManager.getRepository(UserEntity)

    const user = await userRepository.findOne({
      where: {
        email: email,
      },
      relations: ['credential'],
    })

    if (!user) {
      return null
    }

    return UserModelTranslator.toDomain(user, ['credential'])
  }
}
