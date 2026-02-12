import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { TypeOrmManagerResolver } from '~/src/modules/Shared/Infrastructure/TypeOrmManagerResolver'
import { VerificationTokenEntity } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { VerificationTokenModelTranslator } from '~/src/modules/Auth/Infrastructure/ModelTranslators/VerificationTokenModelTranslator'
import { VerificationTokenRepositoryInterface } from '~/src/modules/Auth/Domain/VerificationTokenRepositoryInterface'

export class PostgreSqlVerificationTokenRepository implements VerificationTokenRepositoryInterface {
  constructor(private readonly entityManagerResolver: TypeOrmManagerResolver) {}

  /**
   * Finds a specific VerificationToken by email (and acquires a pessimistic lock on the row)
   * @param email User email
   * @param context The transactional context
   * @returns The locked VerificationToken entity if found, otherwise null
   */
  public async findByEmailWithLock(email: string, context: TxContext): Promise<VerificationToken | null> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const verificationTokenEntity = await entityManager
      .createQueryBuilder(VerificationTokenEntity, 'verification_token')
      .where('verification_token.email = :email', { email })
      .orderBy('verification_token.created_at', 'DESC')
      .setLock('pessimistic_write')
      .getOne()

    if (!verificationTokenEntity) {
      return null
    }

    return VerificationTokenModelTranslator.toDomain(verificationTokenEntity)
  }

  /**
   * Finds a specific VerificationToken by email
   * @param email User email
   * @returns The VerificationToken entity if found, otherwise null
   */
  public async findByEmail(email: string): Promise<VerificationToken | null> {
    const entityManager = this.entityManagerResolver.resolve()

    const verificationTokenEntity = await entityManager
      .createQueryBuilder(VerificationTokenEntity, 'verification_token')
      .where('verification_token.email = :email', { email })
      .orderBy('verification_token.created_at', 'DESC')
      .getOne()

    if (!verificationTokenEntity) {
      return null
    }

    return VerificationTokenModelTranslator.toDomain(verificationTokenEntity)
  }

  /**
   * Saves (inserts or update) a VerificationToken in the database
   * @param verificationToken The VerificationToken domain entity to persist
   * @param context The transactional context
   */
  public async save(verificationToken: VerificationToken, context: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const verificationTokenRepository = entityManager.getRepository(VerificationTokenEntity)

    const verificationTokenRawModel = VerificationTokenModelTranslator.toDatabase(verificationToken)

    await verificationTokenRepository.save(verificationTokenRawModel)
  }

  /**
   * Deletes a VerificationToken from the database given its ID
   * @param verificationTokenId VerificationToken ID
   * @param context The transactional context
   */
  public async delete(verificationTokenId: string, context: TxContext): Promise<void> {
    const entityManager = this.entityManagerResolver.resolve(context)

    const verificationTokenRepository = entityManager.getRepository(VerificationTokenEntity)

    await verificationTokenRepository.delete({ id: verificationTokenId })
  }
}
