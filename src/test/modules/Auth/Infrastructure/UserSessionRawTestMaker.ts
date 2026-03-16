import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { UserSessionTokenHashMother } from '~/src/test/mothers/UserSessionTokenHashMother'
import { UserSessionRawModel, UserSessionRawWithRelationships } from '~/src/modules/Auth/Infrastructure/Entities/user-session.entity'

export const makeRawSession = (overrides: Partial<UserSessionRawModel> = {}): UserSessionRawWithRelationships => {
  return {
    id: overrides.id ?? IdentifierMother.valid().value,
    user_id: overrides.user_id ?? IdentifierMother.valid().value,
    token_hash: overrides.token_hash ?? UserSessionTokenHashMother.random().value,
    revoked_at: overrides.revoked_at ?? null,
    expires_at: overrides.expires_at ?? new Date(Date.now() + 60 * 60 * 1000),
    ip_hash: overrides.ip_hash ?? null,
    user_agent: overrides.user_agent ?? UserAgentMother.random().value,
    device_country_code: overrides.device_country_code ?? null,
    device_city: overrides.device_city ?? null,
    created_at: overrides.created_at ?? new Date(),
    updated_at: overrides.updated_at ?? new Date(),
  }
}
