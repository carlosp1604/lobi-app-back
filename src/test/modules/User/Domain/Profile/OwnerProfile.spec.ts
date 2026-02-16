import { OwnerProfile } from '~/src/modules/User/Domain/Profile/OwnerProfile'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserProfileIdMother } from '~/src/test/mothers/UserProfileIdMother'

describe('OwnerProfile', () => {
  describe('create', () => {
    it('should initialize the OwnerProfile instance correctly with default values', () => {
      const now = new Date('2026-02-16T20:31:00Z')
      const id = UserProfileIdMother.valid()
      const userId = UserIdMother.valid()

      const profile = OwnerProfile.create(id, userId, now)

      expect(profile.id.equals(id)).toBe(true)
      expect(profile.userId.equals(userId)).toBe(true)
      expect(profile.companyName).toBeNull()
      expect(profile.taxId).toBeNull()
      expect(profile.contactPhone).toBeNull()
      expect(profile.createdAt.getTime()).toBe(now.getTime())
      expect(profile.updatedAt.getTime()).toBe(now.getTime())
    })
  })
})
