import fc from 'fast-check'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'

const invalidCases: Array<string> = [
  '',
  '123',
  'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz',
  '12345678-1234-1234-1234-1234567890',
  '123456781234123412341234567890ab',
  '12345678-1234-1234-1234-1234567890ab-',
  '-12345678-1234-1234-1234-1234567890ab',
  '12345678-1234-1234-1234-1234567890abc',
  '12345678_1234_1234_1234_1234567890ab',
  '12345678-1234-1234-1234-1234567890a',
  'g2345678-1234-1234-1234-1234567890ab',
]

describe('UserId', () => {
  it('should not throw error when userId is valid', () => {
    fc.assert(
      fc.property(fc.uuid(), (userId) => {
        expect(() => UserId.fromString(userId)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when userId is not valid: %s', (userId) => {
    expect(() => UserId.fromString(userId)).toThrow(UserDomainException.invalidUserId(userId))
  })

  it('should store the correct value', () => {
    const validValue = UserIdMother.valid().toString()
    const userIdValueObject = UserId.fromString(validValue)

    expect(userIdValueObject.value).toEqual(validValue)
  })
})
