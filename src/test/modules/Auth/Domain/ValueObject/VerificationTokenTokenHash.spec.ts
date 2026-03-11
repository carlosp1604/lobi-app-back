import fc from 'fast-check'
import { VerificationTokenTokenHash } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenTokenHash'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenTokenHashMother } from '~/src/test/mothers/VerificationTokenTokenHashMother'
import { SECURE_HASH_PATTERN } from '~/src/modules/Shared/Domain/ValueObject/CredentialHashValueObject'

const validValues = fc.stringMatching(SECURE_HASH_PATTERN)

const invalidCases: string[] = [
  '',
  '   ',
  '$2b$10$short',
  '$2x$10$' + 'a'.repeat(53),
  '$2b$99$' + 'a'.repeat(53),
  '$2b$10$' + 'a'.repeat(54),
  '$2b$10$' + '****'.repeat(13),
  'a'.repeat(256),
]

describe('VerificationTokenTokenHash', () => {
  it('should not throw error when VerificationToken token hash is valid', () => {
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
    const validValue = VerificationTokenTokenHashMother.valid().value
    const verificationTokenTokenHashValueObject = VerificationTokenTokenHash.fromString(validValue)

    expect(verificationTokenTokenHashValueObject.value).toBe(validValue)
  })
})
