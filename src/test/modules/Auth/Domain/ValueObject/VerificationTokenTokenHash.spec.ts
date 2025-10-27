import fc from 'fast-check'
import { HASH_REGEX } from '~/src/modules/Shared/Domain/ValueObject/HashValueObject'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'

const validValues = fc.stringMatching(HASH_REGEX)

const invalidCases = ['', 'abc', 'a'.repeat(45), '**not-base64**', 'a'.repeat(44)]

describe('VerificationTokenTokenHash', () => {
  it('should not throw error when VerificationToken token hash (base64) is valid', () => {
    fc.assert(
      fc.property(validValues, (tokenHash) => {
        expect(() => VerificationTokenTokenHash.fromString(tokenHash)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when VerificationToken token hash is not valid: "%s"', (tokenHash) => {
    expect(() => VerificationTokenTokenHash.fromString(tokenHash)).toThrow(VerificationTokenDomainException.invalidTokenHash())
  })

  it('should store the correct value', () => {
    const validValue = VerificationTokenTokenHashMother.valid().toString()
    const verificationTokenTokenHashValueObject = VerificationTokenTokenHash.fromString(validValue)

    expect(verificationTokenTokenHashValueObject.value).toEqual(validValue)
  })
})
