import { UserAgent, UserAgentProps } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'

class DummyVO extends ValueObject<UserAgentProps> {
  private constructor(value: UserAgentProps) {
    super(value)
  }

  static fromProps(props: UserAgentProps) {
    return new DummyVO(props)
  }
}

describe('UserAgent', () => {
  const validProps = UserAgentMother.valid().value

  describe('fromProps', () => {
    it('should create a valid UserAgent when props are valid', () => {
      const userAgentValueObject = UserAgent.fromProps(validProps)

      expect(userAgentValueObject.raw).toBe(validProps.raw)
      expect(userAgentValueObject.browser).toEqual(validProps.browser)
      expect(userAgentValueObject.os).toEqual(validProps.os)
      expect(userAgentValueObject.device).toEqual(validProps.device)
    })

    it('should return an unknown UserAgent when the raw string is empty', () => {
      const emptyProps: UserAgentProps = { ...validProps, raw: '   ' }
      const userAgentValueObject = UserAgent.fromProps(emptyProps)

      const unknownUa = UserAgent.unknown()

      expect(userAgentValueObject).toEqual(unknownUa)
    })

    it('should throw error when raw user agent is longer than 512 characters', () => {
      const tooLong = 'a'.repeat(513)
      const invalidProps: UserAgentProps = { ...validProps, raw: tooLong }

      expect(() => UserAgent.fromProps(invalidProps)).toThrow(UserSessionDomainException.invalidUserAgent(tooLong))
    })

    it('should throw error when raw user agent contains non-ASCII visible characters', () => {
      const invalidRaw = 'Mozilla/5.0 😊'
      const invalidProps: UserAgentProps = { ...validProps, raw: invalidRaw }

      expect(() => UserAgent.fromProps(invalidProps)).toThrow(UserSessionDomainException.invalidUserAgent(invalidRaw))
    })
  })

  describe('safeCreate', () => {
    it('should return success when props are valid', () => {
      const result = UserAgent.safeCreate(validProps)

      expect(result.success).toBe(true)
      expect(result['value'].raw).toBe(validProps.raw)
    })

    it('should return fail when raw user agent is longer than 512 characters', () => {
      const tooLong = 'a'.repeat(513)
      const invalidProps: UserAgentProps = { ...validProps, raw: tooLong }

      const result = UserAgent.safeCreate(invalidProps)

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(UserSessionDomainException.invalidUserAgent(tooLong))
    })

    it('should return fail when raw user agent contains invalid characters', () => {
      const invalidRaw = 'Mozilla/5.0 😊'
      const invalidProps: UserAgentProps = { ...validProps, raw: invalidRaw }

      const result = UserAgent.safeCreate(invalidProps)

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(UserSessionDomainException.invalidUserAgent(invalidRaw))
    })
  })

  describe('equals', () => {
    it('returns false when valueObjects values are equal but their types are different', () => {
      const valueA = DummyVO.fromProps(validProps)
      const valueB = UserAgent.fromProps(validProps)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      expect(valueB.equals(valueA)).toBe(false)
    })

    it('should return true when two UserAgents have the same raw string', () => {
      const userAgentValueObject1 = UserAgent.fromProps(validProps)
      const userAgentValueObject2 = UserAgent.fromProps({ ...validProps, browser: { name: 'Different', version: '1.0' } })

      expect(userAgentValueObject1.equals(userAgentValueObject2)).toBe(true)
    })

    it('should return false when compared to null or undefined', () => {
      const userAgentValueObject = UserAgent.fromProps(validProps)

      expect(userAgentValueObject.equals(null)).toBe(false)
      expect(userAgentValueObject.equals(undefined)).toBe(false)
    })
  })
})
