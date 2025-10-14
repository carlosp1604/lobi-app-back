import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserUploadIdMother } from '~/src/test/mothers/UserUploadIdMother'

export const makeRawUser = (overrides: Partial<UserRawModelWithRelations> = {}): UserRawModelWithRelations => {
  return {
    id: overrides.id ?? UserIdMother.valid().toString(),
    email: overrides.email ?? UserEmailMother.random().toString(),
    username: overrides.username ?? UserUsernameMother.random().toString(),
    name: overrides.name ?? UserNameMother.valid().toString(),
    status: overrides.status ?? UserStatus.active().toString(),
    role: overrides.role ?? UserRole.sportsman().toString(),
    user_upload_id: overrides.user_upload_id ?? UserUploadIdMother.valid().toString(),
    email_verified_at: overrides.email_verified_at ?? new Date(),
    created_at: overrides.created_at ?? new Date(),
    updated_at: overrides.updated_at ?? new Date(),
    deleted_at: overrides.deleted_at ?? null,
  }
}
