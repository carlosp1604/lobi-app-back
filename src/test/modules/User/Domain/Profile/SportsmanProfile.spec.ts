import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { SportsmanProfile } from '~/src/modules/User/Domain/Profile/SportsmanProfile'
import { UserProfileIdMother } from '~/src/test/mothers/UserProfileIdMother'

describe('SportsmanProfile', () => {
  describe('create', () => {
    it('should initialize the SportsmanProfile instance correctly with default values', () => {
      const now = new Date('2026-02-16T20:32:00Z')
      const id = UserProfileIdMother.valid()
      const userId = UserIdMother.valid()

      const profile = SportsmanProfile.create(id, userId, now)

      expect(profile.id.equals(id)).toBe(true)
      expect(profile.userId.equals(userId)).toBe(true)
      expect(profile.birthDate).toBeNull()
      expect(profile.bio).toBeNull()
      expect(profile.createdAt.getTime()).toBe(now.getTime())
      expect(profile.updatedAt.getTime()).toBe(now.getTime())
    })
  })
})
