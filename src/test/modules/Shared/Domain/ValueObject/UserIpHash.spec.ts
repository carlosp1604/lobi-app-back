import fc from 'fast-check'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { UserIpHashMother } from '~/src/test/mothers/Domain/Shared/UserIpHashMother'
import { HASH_REGEX } from '~/src/modules/Shared/Domain/ValueObject/HashValueObject'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

const validValues = fc.stringMatching(HASH_REGEX)

describe('UserIpHash', () => {
  it('should not throw error when user IP hash (base64) is valid', () => {
    fc.assert(
      fc.property(validValues, (ipHash) => {
        expect(() => UserIpHash.fromString(ipHash)).not.toThrow()
      }),
    )
  })

  it.each(UserIpHashMother.INVALID_FORMAT_CASES)('should throw error when user IP hash is not valid: "%s"', (ipHash) => {
    expect(() => UserIpHash.fromString(ipHash)).toThrow(SharedDomainException.invalidUserIpHash())
  })

  it('should store the correct value', () => {
    const validValue = UserIpHashMother.valid().value
    const userIpHashValueObject = UserIpHash.fromString(validValue)

    expect(userIpHashValueObject.value).toBe(validValue)
  })
})
