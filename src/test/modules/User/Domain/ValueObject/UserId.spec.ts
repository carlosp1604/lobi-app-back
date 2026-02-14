import fc from 'fast-check'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'

describe('UserId', () => {
  it('should not throw error when userId is valid', () => {
    fc.assert(
      fc.property(fc.uuid(), (userId) => {
        expect(() => UserId.fromString(userId)).not.toThrow()
      }),
    )
  })

  it.each(UserIdMother.INVALID_FORMAT_CASES)('should throw error when userId is not valid: %s', (userId) => {
    expect(() => UserId.fromString(userId)).toThrow(UserDomainException.invalidUserId(userId))
  })

  it('should store the correct value', () => {
    const validValue = UserIdMother.valid().toString()
    const userIdValueObject = UserId.fromString(validValue)

    expect(userIdValueObject.value).toEqual(validValue)
  })
})
