import { OwnerProfile } from '~/src/modules/User/Domain/Profile/OwnerProfile'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'

describe('OwnerProfile', () => {
  describe('create', () => {
    it('should initialize the OwnerProfile instance correctly with default values', () => {
      const now = new Date('2026-02-16T20:31:00Z')
      const id = IdentifierMother.valid()
      const userId = IdentifierMother.valid()

      const profile = OwnerProfile.create(id, userId, now)

      expect(profile.id.equals(id)).toBe(true)
      expect(profile.userId.equals(userId)).toBe(true)
      expect(profile.companyName).toBeNull()
      expect(profile.taxId).toBeNull()
      expect(profile.contactPhone).toBeNull()
      expect(profile.createdAt).toEqual(now)
      expect(profile.updatedAt).toEqual(now)
    })
  })
})
