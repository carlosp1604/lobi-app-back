import { UserCredentialRawModel } from '~/src/modules/Auth/Infrastructure/Entities/user-credential.entity'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'

export const makeRawUserCredential = (overrides: Partial<UserCredentialRawModel> = {}): UserCredentialRawModel => {
  const now = new Date()

  return {
    user_id: overrides.user_id ?? UserIdMother.valid().value,
    password_hash: overrides.password_hash ?? PasswordHashMother.valid().value,
    failed_attempts: overrides.failed_attempts ?? 0,
    locked_until: overrides.locked_until ?? null,
    last_login_at: overrides.last_login_at ?? null,
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  }
}
