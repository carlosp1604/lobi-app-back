import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'

export const makeRawUser = (overrides: Partial<UserRawModelWithRelations> = {}): UserRawModelWithRelations => {
  return {
    id: overrides.id ?? UserIdMother.valid().value,
    email: overrides.email ?? EmailAddressMother.random().value,
    username: overrides.username ?? UserUsernameMother.random().value,
    name: overrides.name ?? UserNameMother.valid().value,
    status: overrides.status ?? UserStatus.active().value,
    role: overrides.role ?? UserRole.sportsman().value,
    user_upload_id: overrides.user_upload_id ?? null,
    email_verified_at: overrides.email_verified_at ?? new Date(),
    created_at: overrides.created_at ?? new Date(),
    updated_at: overrides.updated_at ?? new Date(),
    deleted_at: overrides.deleted_at ?? null,
  }
}
