import { UserRawModel } from '~/src/modules/User/Infrastructure/Entities/UserEntity'
import { UserModelTranslator } from '~/src/modules/User/Infrastructure/ModelTranslators/UserModelTranslator'
import { mock } from 'jest-mock-extended'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserEmail } from '~/src/modules/User/Domain/ValueObject/UserEmail'
import { UserUsername } from '~/src/modules/User/Domain/ValueObject/UserUsername'
import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { UserStatus, ValidUserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserRole, ValidUserRoles } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserUploadId } from '~/src/modules/Media/Domain/ValueObject/UserUploadId'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'

describe('UserModelTranslator', () => {
  const mockedUserId = mock<UserId>({ value: 'test-user-id', toString: () => 'test-user-id' })
  const mockedUserEmail = mock<UserEmail>({ value: 'test-user-email', toString: () => 'test-user-email' })
  const mockedUserUsername = mock<UserUsername>({ value: 'test-user-username', toString: () => 'test-user-username' })
  const mockedUserName = mock<UserName>({ value: 'test-user-name', toString: () => 'test-user-name' })
  const mockedUserStatus = mock<UserStatus>({ value: ValidUserStatus.ACTIVE, toString: () => String(ValidUserStatus.ACTIVE) })
  const mockedUserRole = mock<UserRole>({ value: ValidUserRoles.SPORTSMAN, toString: () => String(ValidUserRoles.SPORTSMAN) })
  const mockedUserUploadId = mock<UserUploadId>({ value: 'test-user-upload-id', toString: () => 'test-user-upload-id' })

  const utcISODate = '2025-09-16T09:14:34.000Z'
  const utcDate = new Date(utcISODate)

  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  describe('toDomain', () => {
    let userIdSpy = jest.spyOn(UserId, 'fromString').mockReturnValueOnce(mockedUserId)
    let userEmailSpy = jest.spyOn(UserEmail, 'fromString').mockReturnValueOnce(mockedUserEmail)
    let userUsernameSpy = jest.spyOn(UserUsername, 'fromString').mockReturnValueOnce(mockedUserUsername)
    let userNameSpy = jest.spyOn(UserName, 'fromString').mockReturnValueOnce(mockedUserName)
    let userStatusSpy = jest.spyOn(UserStatus, 'fromString').mockReturnValueOnce(mockedUserStatus)
    let userRoleSpy = jest.spyOn(UserRole, 'fromString').mockReturnValueOnce(mockedUserRole)
    let userUploadIdSpy = jest.spyOn(UserUploadId, 'fromString').mockReturnValueOnce(mockedUserUploadId)

    beforeEach(() => {
      userIdSpy = jest.spyOn(UserId, 'fromString').mockReturnValueOnce(mockedUserId)
      userEmailSpy = jest.spyOn(UserEmail, 'fromString').mockReturnValueOnce(mockedUserEmail)
      userUsernameSpy = jest.spyOn(UserUsername, 'fromString').mockReturnValueOnce(mockedUserUsername)
      userNameSpy = jest.spyOn(UserName, 'fromString').mockReturnValueOnce(mockedUserName)
      userStatusSpy = jest.spyOn(UserStatus, 'fromString').mockReturnValueOnce(mockedUserStatus)
      userRoleSpy = jest.spyOn(UserRole, 'fromString').mockReturnValueOnce(mockedUserRole)
      userUploadIdSpy = jest.spyOn(UserUploadId, 'fromString').mockReturnValueOnce(mockedUserUploadId)
    })
    const raw: UserRawModel = {
      id: 'u_123',
      email: 'john@example.com',
      username: 'johnny',
      name: 'John Doe',
      status: 'active',
      role: 'admin',
      user_upload_id: 'upload_999',
      email_verified_at: utcISODate,
      created_at: utcISODate,
      updated_at: utcISODate,
      deleted_at: utcISODate,
    }

    it('call correctly to VOs', () => {
      UserModelTranslator.toDomain(raw)

      expect(userIdSpy).toHaveBeenCalledWith('u_123')
      expect(userEmailSpy).toHaveBeenCalledWith('john@example.com')
      expect(userUsernameSpy).toHaveBeenCalledWith('johnny')
      expect(userNameSpy).toHaveBeenCalledWith('John Doe')
      expect(userStatusSpy).toHaveBeenCalledWith('active')
      expect(userRoleSpy).toHaveBeenCalledWith('admin')
      expect(userUploadIdSpy).toHaveBeenCalledWith('upload_999')

      expect(userIdSpy).toHaveBeenCalledTimes(1)
      expect(userEmailSpy).toHaveBeenCalledTimes(1)
      expect(userUsernameSpy).toHaveBeenCalledTimes(1)
      expect(userNameSpy).toHaveBeenCalledTimes(1)
      expect(userStatusSpy).toHaveBeenCalledTimes(1)
      expect(userRoleSpy).toHaveBeenCalledTimes(1)
      expect(userUploadIdSpy).toHaveBeenCalledTimes(1)
    })

    it('does not call to UserUploadID VO when user_upload_id is NULL', () => {
      const rawWithNullishUserUploadId = {
        ...raw,
        user_upload_id: null,
      }

      UserModelTranslator.toDomain(rawWithNullishUserUploadId)

      expect(userUploadIdSpy).not.toHaveBeenCalled()
    })

    describe('nullish properties', () => {
      it('return correct data when deleted_at is not null', () => {
        const result = UserModelTranslator.toDomain(raw)

        expect(result.id.value).toStrictEqual('test-user-id')
        expect(result.email.value).toStrictEqual('test-user-email')
        expect(result.username.value).toStrictEqual('test-user-username')
        expect(result.name.value).toStrictEqual('test-user-name')
        expect(result.status.value).toStrictEqual(ValidUserStatus.ACTIVE)
        expect(result.role.value).toStrictEqual(ValidUserRoles.SPORTSMAN)
        expect(result.userUploadId?.value).toStrictEqual('test-user-upload-id')
        expect(result.emailVerifiedAt).toStrictEqual(utcDate)
        expect(result.createdAt).toStrictEqual(utcDate)
        expect(result.updatedAt).toStrictEqual(utcDate)
        expect(result.deletedAt).toStrictEqual(utcDate)
      })

      it('does not build deletedAt when deleted_at is null', () => {
        const rawWithNullishDeletedAt = {
          ...raw,
          deleted_at: null,
        }

        const result = UserModelTranslator.toDomain(rawWithNullishDeletedAt)

        expect(result.deletedAt).toStrictEqual(null)
      })

      it('does not build UserUploadId when user_upload_id is null', () => {
        const rawWithNullishUserUploadId = {
          ...raw,
          user_upload_id: null,
        }

        const result = UserModelTranslator.toDomain(rawWithNullishUserUploadId)

        expect(result.userUploadId).toStrictEqual(null)
      })
    })

    it('does not mutate raw model', () => {
      UserModelTranslator.toDomain(raw)

      expect(raw.id).toBe('u_123')
      expect(raw.email).toBe('john@example.com')
      expect(raw.username).toBe('johnny')
      expect(raw.name).toBe('John Doe')
      expect(raw.status).toBe('active')
      expect(raw.role).toBe('admin')
      expect(raw.user_upload_id).toBe('upload_999')
      expect(raw.email_verified_at).toBe(utcISODate)
      expect(raw.created_at).toBe(utcISODate)
      expect(raw.updated_at).toBe(utcISODate)
      expect(raw.deleted_at).toBe(utcISODate)
    })
  })

  describe('toDatabase', () => {
    let userTestBuilder = new UserTestBuilder()

    beforeEach(() => {
      userTestBuilder = new UserTestBuilder()
        .withId(mockedUserId)
        .withEmail(mockedUserEmail)
        .withUsername(mockedUserUsername)
        .withName(mockedUserName)
        .withRoleUser(mockedUserRole)
        .withStatus(mockedUserStatus)
        .withUploadId(mockedUserUploadId)
        .withCreatedAt(utcDate)
        .withUpdatedAt(utcDate)
        .withEmailVerifiedAt(utcDate)
        .withDeletedAt(utcDate)
    })

    it('should return correct data', () => {
      const testUser = userTestBuilder.build()

      const result = UserModelTranslator.toDatabase(testUser)

      expect(result.id).toStrictEqual('test-user-id')
      expect(result.email).toStrictEqual('test-user-email')
      expect(result.name).toStrictEqual('test-user-name')
      expect(result.status).toStrictEqual(String(ValidUserStatus.ACTIVE))
      expect(result.role).toStrictEqual(String(ValidUserRoles.SPORTSMAN))
      expect(result.username).toStrictEqual('test-user-username')
      expect(result.user_upload_id).toStrictEqual('test-user-upload-id')
      expect(result.email_verified_at).toStrictEqual(utcISODate)
      expect(result.created_at).toStrictEqual(utcISODate)
      expect(result.updated_at).toStrictEqual(utcISODate)
      expect(result.deleted_at).toStrictEqual(utcISODate)
    })

    it('should return correct when deletedAt is NULL', () => {
      const testUserWithNullishDeletedAt = userTestBuilder.withDeletedAt(null).build()

      const result = UserModelTranslator.toDatabase(testUserWithNullishDeletedAt)

      expect(result.deleted_at).toStrictEqual(null)
    })

    it('should return correct when userUploadId is NULL', () => {
      const testUserWithNullishUserUploadId = userTestBuilder.withUploadId(null).build()

      const result = UserModelTranslator.toDatabase(testUserWithNullishUserUploadId)

      expect(result.user_upload_id).toStrictEqual(null)
    })

    it('does not mutate domain', () => {
      const user = userTestBuilder.build()

      UserModelTranslator.toDatabase(user)

      expect(user.id).toBe(mockedUserId)
      expect(user.email).toBe(mockedUserEmail)
      expect(user.name).toBe(mockedUserName)
      expect(user.status).toBe(mockedUserStatus)
      expect(user.role).toBe(mockedUserRole)
      expect(user.username).toBe(mockedUserUsername)
      expect(user.userUploadId).toBe(mockedUserUploadId)
      expect(user.emailVerifiedAt).toBe(utcDate)
      expect(user.createdAt).toBe(utcDate)
      expect(user.updatedAt).toBe(utcDate)
      expect(user.deletedAt).toBe(utcDate)
    })
  })
})
