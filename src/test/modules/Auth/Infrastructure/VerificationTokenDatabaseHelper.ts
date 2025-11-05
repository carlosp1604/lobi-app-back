import { EntityManager } from 'typeorm'
import {
  VerificationTokenEntity,
  VerificationTokenRawModel,
} from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'

export class VerificationTokenDatabaseHelper {
  constructor(private readonly entityManager: EntityManager) {}

  public async save(verificationTokens: Array<VerificationTokenRawModel> | VerificationTokenRawModel) {
    const verificationTokenRepository = this.entityManager.getRepository(VerificationTokenEntity)

    if (Array.isArray(verificationTokens)) {
      await verificationTokenRepository.save(verificationTokens)
    } else {
      await verificationTokenRepository.save(verificationTokens)
    }
  }

  public async findById(id: string): Promise<VerificationTokenRawModel | null> {
    const verificationTokenRepository = this.entityManager.getRepository(VerificationTokenEntity)

    return verificationTokenRepository.findOneBy({ id })
  }

  public async findByEmailAndPurpose(email: string, purpose: string): Promise<Array<VerificationTokenRawModel>> {
    const verificationTokenRepository = this.entityManager.getRepository(VerificationTokenEntity)

    return verificationTokenRepository.findBy({ email, purpose })
  }

  public async update(id: string, dataToUpdate: Partial<VerificationTokenRawModel>) {
    const verificationTokenRepository = this.entityManager.getRepository(VerificationTokenEntity)

    await verificationTokenRepository.update({ id }, dataToUpdate)
  }

  public async remove(verificationToken: VerificationTokenRawModel): Promise<void> {
    const verificationTokenRepository = this.entityManager.getRepository(VerificationTokenEntity)

    await verificationTokenRepository.remove(verificationToken)
  }
}
