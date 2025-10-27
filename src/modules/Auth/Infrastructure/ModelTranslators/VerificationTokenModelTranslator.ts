import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerificationTokenId } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenId'
import { VerificationTokenType } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenType'
import { VerificationTokenRawModel } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'

export class VerificationTokenModelTranslator {
  public static toDomain(rawModel: VerificationTokenRawModel): VerificationToken {
    return new VerificationToken(
      VerificationTokenId.fromString(rawModel.id),
      UserEmail.fromString(rawModel.email),
      VerificationTokenTokenHash.fromString(rawModel.token_hash),
      VerificationTokenType.fromString(rawModel.purpose),
      rawModel.expires_at,
      rawModel.used_at,
      rawModel.created_at,
    )
  }

  public static toDatabase(domain: VerificationToken): VerificationTokenRawModel {
    return {
      id: domain.id.toString(),
      email: domain.email.toString(),
      token_hash: domain.tokenHash.toString(),
      purpose: domain.purpose.toString(),
      expires_at: domain.expiresAt,
      used_at: domain.usedAt,
      created_at: domain.createdAt,
    }
  }
}
