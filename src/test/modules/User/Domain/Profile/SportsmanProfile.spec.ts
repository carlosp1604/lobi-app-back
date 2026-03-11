import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { SportsmanProfile } from '~/src/modules/User/Domain/Profile/SportsmanProfile'

describe('SportsmanProfile', () => {
  describe('create', () => {
    it('should initialize the SportsmanProfile instance correctly with default values', () => {
      const now = new Date('2026-02-16T20:32:00Z')
      const id = IdentifierMother.valid()
      const userId = IdentifierMother.valid()

      const profile = SportsmanProfile.create(id, userId, now)

      expect(profile.id.equals(id)).toBe(true)
      expect(profile.userId.equals(userId)).toBe(true)
      expect(profile.birthDate).toBeNull()
      expect(profile.bio).toBeNull()
      expect(profile.createdAt).toEqual(now)
      expect(profile.updatedAt).toEqual(now)
    })
  })
})
