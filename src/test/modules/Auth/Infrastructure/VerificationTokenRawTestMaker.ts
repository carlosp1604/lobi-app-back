import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'
import { VerificationTokenRawModel } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'

export const makeRawVerificationToken = (overrides: Partial<VerificationTokenRawModel> = {}): VerificationTokenRawModel => {
  return {
    id: overrides.id ?? VerificationTokenIdMother.valid().toString(),
    email: overrides.email ?? EmailAddressMother.random().toString(),
    token_hash: overrides.token_hash ?? VerificationTokenTokenHashMother.random().toString(),
    purpose: overrides.purpose ?? VerificationTokenPurpose.createAccount().toString(),
    expires_at: overrides.expires_at ?? new Date(Date.now() + 15 * 60 * 1000),
    used_at: overrides.used_at === undefined ? null : overrides.used_at,
    created_at: overrides.created_at ?? new Date(),
  }
}
