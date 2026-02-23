import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenRawModel } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'

export class VerificationTokenModelTranslator {
  public static toDomain(rawModel: VerificationTokenRawModel): VerificationToken {
    return new VerificationToken(
      Identifier.fromString(rawModel.id),
      EmailAddress.fromString(rawModel.email),
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
