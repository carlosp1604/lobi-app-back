import { UserModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/UserModelTranslator'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserUploadIdMother } from '~/src/test/mothers/UserUploadIdMother'
import { makeRawUser } from '~/src/test/modules/User/Infrastructure/UserRawTestMaker'
import { UserRawModelWithRelations } from '~/src/modules/User/Infrastructure/Entities/user.entity'
import { User } from '~/src/modules/User/Domain/User'
import { UserUploadId } from '~/src/modules/Media/Domain/ValueObject/UserUploadId'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'

describe('UserModelTranslator', () => {
  const isoDate = '2025-09-16T09:14:34.000Z'
  const now = new Date(isoDate)

  const baseRaw = makeRawUser({
    email_verified_at: now,
    created_at: now,
    updated_at: now,
    user_upload_id: UserUploadIdMother.valid().value,
    deleted_at: null,
  })

  describe('toDomain', () => {
    const checkResult = (result: User, raw: UserRawModelWithRelations) => {
      expect(result.id).toBeInstanceOf(UserId)
      expect(result.email).toBeInstanceOf(UserEmail)
      expect(result.username).toBeInstanceOf(UserUsername)
      expect(result.name).toBeInstanceOf(UserName)
      expect(result.status).toBeInstanceOf(UserStatus)
      expect(result.role).toBeInstanceOf(UserRole)

      expect(result.id.value).toBe(raw.id)
      expect(result.email.value).toBe(raw.email)
      expect(result.username.value).toBe(raw.username)
      expect(result.name.value).toBe(raw.name)
      expect(result.status.value).toBe(raw.status)
      expect(result.role.value).toBe(raw.role)

      if (raw.user_upload_id === null) {
        expect(result.userUploadId).toBeNull()
      } else {
        expect(result.userUploadId).toBeInstanceOf(UserUploadId)
        expect(result.userUploadId?.value).toBe(raw.user_upload_id)
      }

      expect(result.emailVerifiedAt.getTime()).toBe(raw.email_verified_at.getTime())
      expect(result.createdAt.getTime()).toBe(raw.created_at.getTime())
      expect(result.updatedAt.getTime()).toBe(raw.updated_at.getTime())
      expect(result.deletedAt).toEqual(raw.deleted_at)
    }

    it('should return domain object when nullable fields are not NULL', () => {
      const raw = { ...baseRaw, deleted_at: now }

      const result = UserModelTranslator.toDomain(raw)

      checkResult(result, raw)
      expect(result.deletedAt?.getTime()).toBe(now.getTime())
      expect(result.userUploadId).not.toBeNull()
    })

    it('should return the correct domain object when nullable fields are NULL', () => {
      const raw = { ...baseRaw, user_upload_id: null, deleted_at: null }

      const result = UserModelTranslator.toDomain(raw)

      checkResult(result, raw)
      expect(result.deletedAt).toBeNull()
      expect(result.userUploadId).toBeNull()
    })

    it('should propagate errors from ValueObject', () => {
      const invalidEmail = UserEmailMother.invalid()
      const rawInvalidEmail = { ...baseRaw, email: invalidEmail }

      expect(() => UserModelTranslator.toDomain(rawInvalidEmail)).toThrow(UserDomainException.invalidUserEmail(invalidEmail))
    })

    it('does not mutate the input raw model', () => {
      const raw = structuredClone(baseRaw)

      UserModelTranslator.toDomain(raw)

      expect(raw).toEqual(baseRaw)
    })
  })

  describe('toDatabase', () => {
    let userBuilder: UserTestBuilder

    const checkResult = (result: UserRawModelWithRelations, domain: User) => {
      expect(result.id).toBe(domain.id.value)
      expect(result.email).toBe(domain.email.value)
      expect(result.username).toBe(domain.username.value)
      expect(result.name).toBe(domain.name.value)
      expect(result.status).toBe(domain.status.value)
      expect(result.role).toBe(domain.role.value)

      if (domain.userUploadId === null) {
        expect(result.user_upload_id).toBeNull()
        expect(domain.userUploadId).toBeNull()
      } else {
        expect(result.user_upload_id).toBe(domain.userUploadId.value)
      }

      expect(result.email_verified_at?.getTime()).toBe(domain.emailVerifiedAt?.getTime())
      expect(result.created_at.getTime()).toBe(domain.createdAt.getTime())
      expect(result.updated_at.getTime()).toBe(domain.updatedAt.getTime())
      expect(result.deleted_at).toEqual(domain.deletedAt)
    }

    beforeEach(() => {
      userBuilder = new UserTestBuilder()
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
        .withDeletedAt(null)
    })

    it('should return the correct raw model when nullable fields is not NULL', () => {
      const user = userBuilder.withDeletedAt(now).build()

      const result = UserModelTranslator.toDatabase(user)

      checkResult(result, user)
      expect(result.deleted_at?.getTime()).toBe(now.getTime())
      expect(result.user_upload_id).not.toBeNull()
    })

    it('should return the correct raw model when nullable fields are NULL', () => {
      const user = userBuilder.withUploadId(null).withDeletedAt(null).build()

      const result = UserModelTranslator.toDatabase(user)

      checkResult(result, user)
      expect(result.deleted_at).toBeNull()
      expect(result.user_upload_id).toBeNull()
    })

    it('does not mutate the input domain object', () => {
      const user = userBuilder.withDeletedAt(now).build()

      const snapshot = {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        status: user.status,
        role: user.role,
        userUploadId: user.userUploadId,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt,
      }

      UserModelTranslator.toDatabase(user)

      expect(user.id.equals(snapshot.id)).toBe(true)
      expect(user.email.equals(snapshot.email)).toBe(true)
      expect(user.username.equals(snapshot.username)).toBe(true)
      expect(user.name.equals(snapshot.name)).toBe(true)
      expect(user.status.equals(snapshot.status)).toBe(true)
      expect(user.role.equals(snapshot.role)).toBe(true)
      expect(user.userUploadId?.equals(snapshot.userUploadId)).toBe(true)
      expect(user.emailVerifiedAt?.getTime()).toBe(snapshot.emailVerifiedAt?.getTime())
      expect(user.createdAt.getTime()).toBe(snapshot.createdAt.getTime())
      expect(user.updatedAt.getTime()).toBe(snapshot.updatedAt.getTime())
      expect(user.deletedAt?.getTime()).toBe(snapshot.deletedAt?.getTime())
    })
  })
})
