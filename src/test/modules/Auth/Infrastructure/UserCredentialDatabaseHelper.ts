import { EntityManager } from 'typeorm'
import {
  UserCredentialEntity,
  UserCredentialRawWitRelationships,
} from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'

export class UserCredentialDatabaseHelper {
  constructor(private readonly entityManager: EntityManager) {}

  public async findUserCredential(userId: string) {
    const userCredentialRepository = this.entityManager.getRepository(UserCredentialEntity)

    return userCredentialRepository.findOneBy({
      user_id: userId,
    })
  }

  public async save(userCredentials: UserCredentialRawWitRelationships | Array<UserCredentialRawWitRelationships>) {
    const userCredentialRepository = this.entityManager.getRepository(UserCredentialEntity)

    if (Array.isArray(userCredentials)) {
      await userCredentialRepository.save(userCredentials)
    } else {
      await userCredentialRepository.save(userCredentials)
    }
  }

  public async delete(userId: string) {
    const userCredentialRepository = this.entityManager.getRepository(UserCredentialEntity)

    await userCredentialRepository.delete({ user_id: userId })
  }
}
