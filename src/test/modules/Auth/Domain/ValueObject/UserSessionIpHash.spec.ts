import fc from 'fast-check'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { UserSessionIpHash } from '~/src/modules/Auth/Domain/ValueObject/UserSessionIpHash'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'

const validValues = fc.uint8Array({ minLength: 32, maxLength: 32 }).map((bytes) => Buffer.from(bytes).toString('base64'))

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
    const validValue = UserSessionIpHashMother.valid().toString()
    const userSessionIpHashValueObject = UserSessionIpHash.fromString(validValue)

    expect(userSessionIpHashValueObject.value).toEqual(validValue)
  })
})
