import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenRawModel } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'

export const makeRawVerificationToken = (overrides: Partial<VerificationTokenRawModel> = {}): VerificationTokenRawModel => {
  return {
    id: overrides.id ?? IdentifierMother.valid().value,
    email: overrides.email ?? EmailAddressMother.random().value,
    token_hash: overrides.token_hash ?? VerificationTokenTokenHashMother.random().value,
    purpose: overrides.purpose ?? VerificationTokenPurpose.createAccount().value,
    expires_at: overrides.expires_at ?? new Date(Date.now() + 15 * 60 * 1000),
    used_at: overrides.used_at === undefined ? null : overrides.used_at,
    created_at: overrides.created_at ?? new Date(),
  }
}
