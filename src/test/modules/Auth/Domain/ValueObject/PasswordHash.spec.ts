import fc from 'fast-check'
import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'
import { UserCredentialDomainException } from '~/src/modules/Auth/Domain/UserCredentialDomainException'

const bcryptAlphabet = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('')
const bcryptTailArb = fc.array(fc.constantFrom(...bcryptAlphabet), { minLength: 53, maxLength: 53 }).map((chars) => chars.join(''))

const bcryptArb = fc
  .tuple(fc.constantFrom('2a', '2b', '2y'), fc.integer({ min: 4, max: 31 }), bcryptTailArb)
  .map(([version, cost, tail]) => `$${version}$${String(cost).padStart(2, '0')}$${tail}`)

const invalidCases: string[] = [
  '',
  '   ',
  '$2b$10$short',
  '$2x$10$' + 'a'.repeat(53),
  '$2b$99$' + 'a'.repeat(53),
  '$2b$10$' + 'a'.repeat(54),
  '$2b$10$' + '****'.repeat(13),
]

describe('PasswordHash', () => {
  it('should not throw error when passwordHash is valid', () => {
    fc.assert(
      fc.property(bcryptArb, (hash) => {
        expect(() => PasswordHash.fromString(hash)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when passwordHash is invalid: %s', (hash) => {
    expect(() => PasswordHash.fromString(hash)).toThrow(UserCredentialDomainException.invalidPasswordHash())
  })

  it('should store the correct value', () => {
    const validHash = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8FhVG0aUoUsvhj5kLVJk0r8O.3/0Fe'
    const passwordHashValueObject = PasswordHash.fromString(validHash)

    expect(passwordHashValueObject.value).toEqual(validHash)
  })
})
