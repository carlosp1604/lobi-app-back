import fc from 'fast-check'
import { UserSessionTokenHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionTokenHash'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { UserSessionTokenHashMother } from '~/src/test/mothers/UserSessionTokenHashMother'

const validValues = fc.uint8Array({ minLength: 32, maxLength: 32 }).map((bytes) => Buffer.from(bytes).toString('base64'))

const invalidCases = ['', 'abc', 'a'.repeat(45), '**not-base64**', 'a'.repeat(44)]

describe('UserSessionTokenHash', () => {
  it('should not throw error when user session hash (base64) is valid', () => {
    fc.assert(
      fc.property(validValues, (hash) => {
        expect(() => UserSessionTokenHash.fromString(hash)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when user session hash is not valid: "%s"', (hash) => {
    expect(() => UserSessionTokenHash.fromString(hash)).toThrow(UserSessionDomainException.invalidUserSessionTokenHash())
  })

  it('should store the correct value', () => {
    const validValue = UserSessionTokenHashMother.valid().toString()
    const userSessionHashValueObject = UserSessionTokenHash.fromString(validValue)

    expect(userSessionHashValueObject.value).toEqual(validValue)
  })
})
