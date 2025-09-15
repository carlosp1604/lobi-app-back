import fc from 'fast-check'
import { UserDomainException } from '~/src/modules/Users/Domain/UserDomainException'
import { UserId } from '~/src/modules/Users/Domain/ValueObject/UserId'

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
    const userIdValueObject = UserId.fromString('46ec1569-1d5c-40e4-b923-ffb18c1f1add')

    expect(userIdValueObject.value).toEqual('46ec1569-1d5c-40e4-b923-ffb18c1f1add')
  })
})
