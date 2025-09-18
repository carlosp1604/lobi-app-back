import fc from 'fast-check'
import { UserSessionHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionHash'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { UserSessionHashMother } from '~/src/test/mothers/UserSessionHashMother'

const validValues = fc.uint8Array({ minLength: 32, maxLength: 32 }).map((bytes) => Buffer.from(bytes).toString('base64'))

const invalidCases = ['', 'abc', 'a'.repeat(45), '**not-base64**', 'a'.repeat(44)]

describe('UserSessionHash', () => {
  it('should not throw error when user session hash (base64) is valid', () => {
    fc.assert(
      fc.property(validValues, (hash) => {
        expect(() => UserSessionHash.fromString(hash)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when user session hash is not valid: "%s"', (hash) => {
    expect(() => UserSessionHash.fromString(hash)).toThrow(UserSessionDomainException.invalidUserSessionHash())
  })

  it('should store the correct value', () => {
    const validValue = UserSessionHashMother.valid().toString()
    const userSessionHashValueObject = UserSessionHash.fromString(validValue)

    expect(userSessionHashValueObject.value).toEqual(validValue)
  })
})
