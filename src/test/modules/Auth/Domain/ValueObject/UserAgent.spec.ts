import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'

describe('UserAgent VO', () => {
  it('should not throw error when user agent is valid', () => {
    const value = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    const ua = UserAgent.fromString(value)

    expect(ua.toString()).toBe(value)
  })

  it('should throw error when user agent is empty', () => {
    expect(() => UserAgent.fromString('')).toThrow(UserSessionDomainException.invalidUserAgent(''))
  })

  it('should throw error when user agent is longer than 512 characters', () => {
    const tooLong = 'a'.repeat(513)
    expect(() => UserAgent.fromString(tooLong)).toThrow(UserSessionDomainException.invalidUserAgent('a'.repeat(513)))
  })

  it('should throw error when user agent contains non-ASCII visible characters', () => {
    const invalid = 'Mozilla/5.0 😊'
    expect(() => UserAgent.fromString(invalid)).toThrow(UserSessionDomainException.invalidUserAgent('Mozilla/5.0 😊'))
  })
})
