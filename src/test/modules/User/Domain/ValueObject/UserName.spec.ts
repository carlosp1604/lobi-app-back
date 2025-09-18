import fc from 'fast-check'
import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'

const invalidCases: string[] = ['', 'a', '   ', 'a'.repeat(256), 'Pepe!', '1234', 'J\nP']

const userNameRegex = /^[\p{L} \-']{2,255}$/u

const validUserNames = fc
  .string({ minLength: 0, maxLength: 512 })
  .map((s) => s.trim())
  .filter((s) => userNameRegex.test(s))

describe('UserName', () => {
  it('should not throw error when user name is valid', () => {
    fc.assert(
      fc.property(validUserNames, (userName) => {
        expect(() => UserName.fromString(userName)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when user name is not valid: %s', (userName) => {
    expect(() => UserName.fromString(userName)).toThrow(UserDomainException.invalidUserName(userName))
  })

  it('should store the correct value', () => {
    const validValue = UserNameMother.valid().toString()
    const userNameValueObject = UserName.fromString(validValue)

    expect(userNameValueObject.value).toEqual(validValue)
  })
})
