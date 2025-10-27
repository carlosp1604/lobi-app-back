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

describe('ValueObject', () => {
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

    it('returns false when valueObjects values are equal but their types are different', () => {
      const a = DummyVO.fromString('abc')
      const b = AnotherDummyVO.fromString('abc')

      expect(a.equals(b)).toBe(false)
    })

    it('returns false when compared with null', () => {
      const a = DummyVO.fromString('abc')

      expect(a.equals(null)).toBe(false)
    })

    it('returns false when compared with undefined', () => {
      const a = DummyVO.fromString('abc')

      expect(a.equals(undefined)).toBe(false)
    })
  })

  describe('toString', () => {
    it('returns correct data', () => {
      const a = DummyVO.fromString('abc')

      expect(a.toString()).toBe('abc')
    })
  })
})
