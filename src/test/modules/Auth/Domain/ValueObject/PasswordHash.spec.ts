import fc from 'fast-check'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'
import { UserCredentialDomainException } from '~/src/modules/Auth/Domain/UserCredentialDomainException'
import { PasswordHashMother } from '~/src/test/mothers/PasswordHashMother'
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

describe('PasswordHash', () => {
  it('should not throw error when passwordHash is valid', () => {
    fc.assert(
      fc.property(validValues, (hash) => {
        expect(() => PasswordHash.fromString(hash)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when passwordHash is invalid: %s', (hash) => {
    expect(() => PasswordHash.fromString(hash)).toThrow(UserCredentialDomainException.invalidPasswordHashFormat())
  })

  it('should store the correct value', () => {
    const validHash = PasswordHashMother.valid().toString()
    const passwordHashValueObject = PasswordHash.fromString(validHash)

    expect(passwordHashValueObject.value).toEqual(validHash)
  })
})
