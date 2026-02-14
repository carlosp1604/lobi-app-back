import fc from 'fast-check'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserProfileId } from '~/src/modules/User/Domain/ValueObject/Profile/UserProfileId'
import { UserProfileIdMother } from '~/src/test/mothers/UserProfileIdMother'
import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'

describe('UserProfileId', () => {
  describe('fromString', () => {
    it('should not throw error when user profile ID is valid', () => {
      fc.assert(
        fc.property(fc.uuid(), (userProfileId) => {
          expect(() => UserProfileId.fromString(userProfileId)).not.toThrow()
        }),
      )
    })

    it.each(UserIdMother.INVALID_FORMAT_CASES)('should throw error when user profile ID is not valid: %s', (userProfileId) => {
      expect(() => UserProfileId.fromString(userProfileId)).toThrow(ProfileDomainException.invalidUserProfileId(userProfileId))
    })
  })

  describe('safeCreate', () => {
    it('should not throw error when user profile ID is valid', () => {
      fc.assert(
        fc.property(fc.uuid(), (userProfileId) => {
          const result = UserProfileId.safeCreate(userProfileId)

          expect(result.success).toBe(true)
        }),
      )
    })

    it.each(UserIdMother.INVALID_FORMAT_CASES)('should throw error when user profile ID is not valid: %s', (userProfileId) => {
      const result = UserProfileId.safeCreate(userProfileId)

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(ProfileDomainException.invalidUserProfileId(userProfileId))
    })
  })

  it('should store the correct value normalized (trimmed)', () => {
    const validValue = '  ' + UserProfileIdMother.valid().toString() + '  '
    const userProfileIdValueObject = UserProfileId.fromString(validValue)

    expect(userProfileIdValueObject.value).toEqual(validValue.trim())
  })
})
