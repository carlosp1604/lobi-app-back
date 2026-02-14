import { SportsmanProfileRawWithRelationships } from '~/src/modules/User/Infrastructure/Entities/Profiles/sportsman-profile.entity'
import { UserProfileIdMother } from '~/src/test/mothers/UserProfileIdMother'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'

export const makeRawSportsmanProfile = (
  overrides: Partial<SportsmanProfileRawWithRelationships> = {},
): SportsmanProfileRawWithRelationships => {
  return {
    id: overrides.id ?? UserProfileIdMother.valid().value,
    bio: overrides.bio ?? null,
    birth_date: overrides.birth_date ?? null,
    user_id: overrides.user_id ?? UserIdMother.valid().value,
    created_at: overrides.created_at ?? new Date(),
    updated_at: overrides.updated_at ?? new Date(),
  }
}
