import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { User } from '~/src/modules/User/Domain/User'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { UserEntity } from '~/src/modules/User/Infrastructure/Entities/User.entity'
import { UserModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/UserModelTranslator'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class PostgresqlUserRepository implements UserRepositoryInterface {
  constructor(@Inject() private readonly entityManagerResolver: TypeOrmManagerResolver) {}

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
