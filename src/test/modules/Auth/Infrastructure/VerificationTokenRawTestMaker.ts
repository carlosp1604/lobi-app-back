import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { VerificationTokenRawModel } from '~/src/modules/Auth/Infrastructure/Entities/verification-token.entity'
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { VerificationTokenType } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenType'

export const makeRawVerificationToken = (overrides: Partial<VerificationTokenRawModel> = {}): VerificationTokenRawModel => {
  return {
    id: overrides.id ?? VerificationTokenIdMother.valid().toString(),
    email: overrides.email ?? UserEmailMother.random().toString(),
    token_hash: overrides.token_hash ?? VerificationTokenTokenHashMother.random().toString(),
    purpose: overrides.purpose ?? VerificationTokenType.createAccount().toString(),
    expires_at: overrides.expires_at ?? new Date(Date.now() + 15 * 60 * 1000),
    used_at: overrides.used_at === undefined ? null : overrides.used_at,
    created_at: overrides.created_at ?? new Date(),
  }
}
