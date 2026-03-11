import fc from 'fast-check'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { HASH_REGEX } from '~/src/modules/Shared/Domain/ValueObject/HashValueObject'

const validValues = fc.stringMatching(HASH_REGEX)

const invalidCases = ['', 'abc', 'a'.repeat(45), '**not-base64**', 'a'.repeat(44)]

describe('UserSessionIpHash', () => {
  it('should not throw error when user session IP hash (base64) is valid', () => {
    fc.assert(
      fc.property(validValues, (ipHash) => {
        expect(() => UserSessionIpHash.fromString(ipHash)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when user session IP hash is not valid: "%s"', (ipHash) => {
    expect(() => UserSessionIpHash.fromString(ipHash)).toThrow(UserSessionDomainException.invalidUserSessionIpHash())
  })

  it('should store the correct value', () => {
    const validValue = UserSessionIpHashMother.valid().value
    const userSessionIpHashValueObject = UserSessionIpHash.fromString(validValue)

    expect(userSessionIpHashValueObject.value).toBe(validValue)
  })
})
