import { User } from '~/src/modules/User/Domain/User'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'

describe('User', () => {
  describe('isActive', () => {
    it('should return true when user is active and not deleted', () => {
      const user = new UserTestBuilder().withStatus(UserStatus.active()).withDeletedAt(null).build()

      expect(user.isActive()).toBe(true)
    })

    it('should return false when user is not in active status', () => {
      const user = new UserTestBuilder().withStatus(UserStatus.deactivated()).withDeletedAt(null).build()

      expect(user.isActive()).toBe(false)
    })

    it('should return false when user is active but has been deleted (soft delete)', () => {
      const user = new UserTestBuilder().withStatus(UserStatus.active()).withDeletedAt(new Date()).build()

      expect(user.isActive()).toBe(false)
    })

    it('should return false when user is both inactive and deleted', () => {
      const user = new UserTestBuilder().withStatus(UserStatus.deactivated()).withDeletedAt(new Date()).build()

      expect(user.isActive()).toBe(false)
    })
  })

  describe('create', () => {
    it('should initialize the User instance correctly', () => {
      const now = new Date('2025-01-02T03:04:05.000Z')
      const id = IdentifierMother.valid()
      const email = EmailAddressMother.valid()
      const username = UserUsernameMother.valid()
      const name = UserNameMother.valid()
      const role = UserRole.sportsman()

      const user = User.create(id, email, username, name, role, now)

      expect(user.id.equals(id)).toBe(true)
      expect(user.email.equals(email)).toBe(true)
      expect(user.username.equals(username)).toBe(true)
      expect(user.name.equals(name)).toBe(true)
      expect(user.role.equals(UserRole.sportsman())).toBe(true)
      expect(user.userUploadId).toBeNull()
      expect(user.status.equals(UserStatus.active())).toBe(true)
      expect(user.emailVerifiedAt).toEqual(now)
      expect(user.createdAt).toEqual(now)
      expect(user.updatedAt).toEqual(now)
      expect(user.deletedAt).toBeNull()
    })
  })
})
