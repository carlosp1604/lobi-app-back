import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
import { UserCredentialRawModel } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'

export const makeRawUserCredential = (overrides: Partial<UserCredentialRawModel> = {}): UserCredentialRawModel => {
  const now = new Date()

  return {
    user_id: overrides.user_id ?? IdentifierMother.valid().value,
    password_hash: overrides.password_hash ?? PasswordHashMother.valid().value,
    failed_attempts: overrides.failed_attempts ?? 0,
    locked_until: overrides.locked_until ?? null,
    last_login_at: overrides.last_login_at ?? null,
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  }
}
