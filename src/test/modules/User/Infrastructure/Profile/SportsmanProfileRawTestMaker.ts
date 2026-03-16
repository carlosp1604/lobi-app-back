import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { SportsmanProfileRawWithRelationships } from '~/src/modules/User/Infrastructure/Entities/Profiles/sportsman-profile.entity'

export const makeRawSportsmanProfile = (
  overrides: Partial<SportsmanProfileRawWithRelationships> = {},
): SportsmanProfileRawWithRelationships => {
  return {
    id: overrides.id ?? IdentifierMother.valid().value,
    bio: overrides.bio ?? null,
    birth_date: overrides.birth_date ?? null,
    user_id: overrides.user_id ?? IdentifierMother.valid().value,
    created_at: overrides.created_at ?? new Date(),
    updated_at: overrides.updated_at ?? new Date(),
  }
}
