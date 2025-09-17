import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'

class DummyVO extends ValueObject<string> {
  static fromString(value: string) {
    return new DummyVO(value)
  }

  private constructor(value: string) {
    super(value)
  }
}

class AnotherDummyVO extends ValueObject<string> {
  static fromString(value: string) {
    return new AnotherDummyVO(value)
  }

  private constructor(value: string) {
    super(value)
  }
}

describe('ValueObject base', () => {
  describe('equals', () => {
    it('returns true when valueObjects are equals', () => {
      const a = DummyVO.fromString('abc')
      const b = DummyVO.fromString('abc')

      expect(a.equals(b)).toBe(true)
    })

    it('returns false when valueObject values are different', () => {
      const a = DummyVO.fromString('abc')
      const b = DummyVO.fromString('xyz')

      expect(a.equals(b)).toBe(false)
    })

    it('returns false when valueObjects values are equal but its types are different', () => {
      const a = DummyVO.fromString('abc')
      const b = AnotherDummyVO.fromString('abc')

      expect(a.equals(b)).toBe(false)
    })

    it('returns false when compared with null or undefined', () => {
      const a = DummyVO.fromString('abc')

      expect(a.equals(null as any)).toBe(false)
      expect(a.equals(undefined as any)).toBe(false)
    })
  })

  describe('toString', () => {
    it('returns correct data', () => {
      const a = DummyVO.fromString('abc')

      expect(a.toString()).toBe('abc')
    })
  })
})
