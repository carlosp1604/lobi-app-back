import { UserModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/UserModelTranslator'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserUploadIdMother } from '~/src/test/mothers/UserUploadIdMother'
import { UserRawModel } from '~/src/modules/User/Infrastructure/Entities/User.entity'

describe('UserModelTranslator', () => {
  const isoDate = '2025-09-16T09:14:34.000Z'

  const baseRaw: UserRawModel = {
    id: UserIdMother.valid().toString(),
    email: UserEmailMother.valid().toString(),
    username: UserUsernameMother.valid().toString(),
    name: UserNameMother.valid().toString(),
    status: UserStatus.active().toString(),
    role: UserRole.sportsman().toString(),
    user_upload_id: UserUploadIdMother.valid().toString(),
    email_verified_at: isoDate,
    created_at: isoDate,
    updated_at: isoDate,
    deleted_at: null,
  }

  describe('toDomain', () => {
    it('returns correct data', () => {
      const result = UserModelTranslator.toDomain(baseRaw)

      expect(result.id.toString()).toBe(baseRaw.id)
      expect(result.email.toString()).toBe(baseRaw.email)
      expect(result.username.toString()).toBe(baseRaw.username)
      expect(result.name.toString()).toBe(baseRaw.name)
      expect(result.status.equals(UserStatus.active())).toBe(true)
      expect(result.role.equals(UserRole.sportsman())).toBe(true)
      expect(result.userUploadId?.toString()).toBe(baseRaw.user_upload_id)
      expect(result.emailVerifiedAt.toISOString()).toBe(isoDate)
      expect(result.createdAt.toISOString()).toBe(isoDate)
      expect(result.updatedAt.toISOString()).toBe(isoDate)
      expect(result.deletedAt).toBeNull()
    })

    it('returns correct data when user_upload_id or deleted_at are NULL', () => {
      const raw = { ...baseRaw, user_upload_id: null, deleted_at: isoDate }

      const result = UserModelTranslator.toDomain(raw)

      expect(result.userUploadId).toBeNull()
      expect(result.deletedAt?.toISOString()).toBe(isoDate)
    })

    it('does not mutate input', () => {
      const raw = structuredClone(baseRaw)

      UserModelTranslator.toDomain(raw)

      expect(raw).toEqual(baseRaw)
    })
  })

  describe('toDatabase', () => {
    const now = new Date(isoDate)

    let userTestBuilder = new UserTestBuilder()

    beforeEach(() => {
      userTestBuilder = new UserTestBuilder()
        .withId(UserIdMother.valid())
        .withEmail(UserEmailMother.valid())
        .withUsername(UserUsernameMother.valid())
        .withName(UserNameMother.valid())
        .withRoleUser(UserRole.sportsman())
        .withStatus(UserStatus.active())
        .withUploadId(UserUploadIdMother.valid())
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .withEmailVerifiedAt(now)
        .withDeletedAt(now)
    })

    it('returns correct data', () => {
      const user = userTestBuilder.build()
      const row = UserModelTranslator.toDatabase(user)

      expect(row).toEqual({
        id: user.id.toString(),
        email: user.email.toString(),
        username: user.username.toString(),
        name: user.name.toString(),
        status: String(UserStatus.active()),
        role: String(UserRole.sportsman()),
        user_upload_id: user.userUploadId?.toString(),
        email_verified_at: now.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        deleted_at: now.toISOString(),
      })
    })

    it('returns correct data when user_upload_id or deleted_at are NULL', () => {
      const user = userTestBuilder.withDeletedAt(null).withUploadId(null).build()

      const row = UserModelTranslator.toDatabase(user)

      expect(row.user_upload_id).toBeNull()
      expect(row.deleted_at).toBeNull()
    })

    it('does not mutate input', () => {
      const user = userTestBuilder.build()

      const snapshot = {
        id: user.id.toString(),
        email: user.email.toString(),
        name: user.name.toString(),
        status: user.status.toString(),
        role: user.role.toString(),
        username: user.username.toString(),
        userUploadId: user.userUploadId?.toString(),
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      }

      UserModelTranslator.toDatabase(user)

      expect(user.id.toString()).toBe(snapshot.id)
      expect(user.email.toString()).toBe(snapshot.email)
      expect(user.name.toString()).toBe(snapshot.name)
      expect(user.status.toString()).toBe(snapshot.status)
      expect(user.role.toString()).toBe(snapshot.role)
      expect(user.username.toString()).toBe(snapshot.username)
      expect(user.userUploadId?.toString()).toBe(snapshot.userUploadId)
      expect(user.emailVerifiedAt).toBe(snapshot.emailVerifiedAt)
      expect(user.createdAt).toBe(snapshot.createdAt)
      expect(user.updatedAt).toBe(snapshot.updatedAt)
      expect(user.deletedAt).toBe(snapshot.deletedAt)
    })
  })
})
