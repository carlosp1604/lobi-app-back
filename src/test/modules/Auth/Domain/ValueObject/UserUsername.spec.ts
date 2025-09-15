import fc from 'fast-check'
import { UserDomainException } from '~/src/modules/Users/Domain/UserDomainException'
import { UserUsername } from '~/src/modules/Users/Domain/ValueObject/UserUsername'

const invalidCases: Array<string> = [
  '',
  'abc',
  'abcde',
  'a bcd',
  'abcd!',
  'abcd-efg',
  'abc\ndef',
  'abc\tdef',
  'a'.repeat(33),
  '....',
  '____',
  '.abc',
  '_abc',
  'abc.',
  'abc_',
  'ab..cd',
  'ab__cd',
  'ab._cd',
  'ab_.cd',
]

const letter = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
const alphanumeric = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
const sep = fc.constantFrom('.', '_')

export const validCases = fc
  .tuple(
    letter,
    fc.array(alphanumeric, { minLength: 0, maxLength: 9 }),
    fc.array(fc.tuple(sep, fc.array(alphanumeric, { minLength: 1, maxLength: 10 })), {
      maxLength: 5,
    }),
    fc.array(alphanumeric, { minLength: 0, maxLength: 20 }),
  )
  .map(([first, headRest, blocks, tail]) => {
    const head = first + headRest.join('')
    const mid = blocks.map(([s, b]) => s + b.join('')).join('')
    return head + mid + tail.join('')
  })
  .filter((u) => u.length >= 6 && u.length <= 32)

describe('UserUsername', () => {
  it('should not throw error when username is valid', () => {
    fc.assert(
      fc.property(validCases, (username) => {
        expect(() => UserUsername.fromString(username)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when username is not valid: %s', (username) => {
    expect(() => UserUsername.fromString(username)).toThrow(UserDomainException.invalidUsername(username))
  })

  it('should store the correct value', () => {
    const usernameValueObject = UserUsername.fromString('valid_us3rn4me')

    expect(usernameValueObject.value).toEqual('valid_us3rn4me')
  })
})
