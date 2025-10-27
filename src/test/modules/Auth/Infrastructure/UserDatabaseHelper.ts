import { EntityManager } from 'typeorm'
import { UserEntity, UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'

export class UserDatabaseHelper {
  constructor(private readonly entityManager: EntityManager) {}

  public async save(users: Array<UserRawModelWithRelations> | UserRawModelWithRelations) {
    const userRepository = this.entityManager.getRepository(UserEntity)

    if (Array.isArray(users)) {
      await userRepository.save(users)
    } else {
      await userRepository.save(users)
    }
  }

  public async update(id: string, dataToUpdate: Partial<UserRawModelWithRelations>) {
    const userRepository = this.entityManager.getRepository(UserEntity)

    await userRepository.update({ id }, dataToUpdate)
  }
}
