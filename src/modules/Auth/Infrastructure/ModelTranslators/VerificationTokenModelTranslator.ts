import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerificationTokenId } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenId'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenRawModel } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'
import { VerificationTokenEmail } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenEmail'

export class VerificationTokenModelTranslator {
  public static toDomain(rawModel: VerificationTokenRawModel): VerificationToken {
    return new VerificationToken(
      VerificationTokenId.fromString(rawModel.id),
      VerificationTokenEmail.fromString(rawModel.email),
      VerificationTokenTokenHash.fromString(rawModel.token_hash),
      VerificationTokenPurpose.fromString(rawModel.purpose),
      rawModel.expires_at,
      rawModel.used_at,
      rawModel.created_at,
    )
  }

  public static toDatabase(domain: VerificationToken): VerificationTokenRawModel {
    return {
      id: domain.id.value,
      email: domain.email.value,
      token_hash: domain.tokenHash.value,
      purpose: domain.purpose.value,
      expires_at: domain.expiresAt,
      used_at: domain.usedAt,
      created_at: domain.createdAt,
    }
  }
}
