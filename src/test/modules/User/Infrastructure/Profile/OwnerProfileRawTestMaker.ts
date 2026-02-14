import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserProfileIdMother } from '~/src/test/mothers/UserProfileIdMother'
import { OwnerProfileRawWithRelationships } from '~/src/modules/User/Infrastructure/Entities/Profiles/owner-profile.entity'

export const makeRawOwnerProfile = (overrides: Partial<OwnerProfileRawWithRelationships> = {}): OwnerProfileRawWithRelationships => {
  return {
    id: overrides.id ?? UserProfileIdMother.valid().value,
    company_name: overrides.company_name ?? null,
    contact_phone: overrides.contact_phone ?? null,
    tax_id: overrides.tax_id ?? null,
    user_id: overrides.user_id ?? UserIdMother.valid().value,
    created_at: overrides.created_at ?? new Date(),
    updated_at: overrides.updated_at ?? new Date(),
  }
}
