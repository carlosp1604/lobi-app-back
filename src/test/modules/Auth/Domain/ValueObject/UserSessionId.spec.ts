import fc from 'fast-check'
import { UserSessionId } from '~/src/modules/Auth/Domain/ValueObject/UserSessionId'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'

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

describe('UserSessionId', () => {
  it('should not throw error when user session id is valid', () => {
    fc.assert(
      fc.property(fc.uuid(), (userSessionId) => {
        expect(() => UserSessionId.fromString(userSessionId)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when user session id is not valid: %s', (userSessionId) => {
    expect(() => UserSessionId.fromString(userSessionId)).toThrow(UserSessionDomainException.invalidUserSessionId(userSessionId))
  })

  it('should store the correct value', () => {
    const validValue = UserSessionIdMother.valid().toString()
    const userSessionIdValueObject = UserSessionId.fromString(validValue)

    expect(userSessionIdValueObject.value).toEqual(validValue)
  })
})
