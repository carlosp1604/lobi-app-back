import { NumberPrecision } from '~/src/modules/Shared/Domain/NumberPrecision'

describe('NumberPrecision', () => {
  describe('format', () => {
    it('should truncate at 8 decimal when no second parameter is provided', () => {
      const value = 1.12345678999
      const result = NumberPrecision.format(value)

      expect(result).toBe(1.12345678)
    })

    it('should default to specified decimals when second parameter is provided', () => {
      const value = 1.12345678999
      const result = NumberPrecision.format(value, 4)

      expect(result).toBe(1.1234)
    })

    it('should truncate to integer part when requested decimals are negative', () => {
      const value = 1.12345678999
      const result = NumberPrecision.format(value, -1)

      expect(result).toBe(1)
    })

    it('should return 0 when requested decimals are not a number', () => {
      const result = NumberPrecision.format(NaN)

      expect(result).toBe(0)
    })

    it('should return 0 when requested decimals are Infinity', () => {
      const result = NumberPrecision.format(Infinity)

      expect(result).toBe(0)
    })

    it('should handle floating point precision issues', () => {
      // eslint-disable-next-line no-loss-of-precision
      const value = 1.0000000000000001
      const result = NumberPrecision.format(value, 2)

      expect(result).toBe(1)
    })

    it('should handle floating point numbers correctly', () => {
      const value = 1e-7

      const result = NumberPrecision.format(value, 4)

      expect(result).toBe(0)
    })
  })

  describe('round', () => {
    it('should round to 8 decimal places by default when no second parameter is provided', () => {
      const value = 1.123456785
      const result = NumberPrecision.round(value)

      expect(result).toBe(1.12345679)
    })

    it('should round up when the next decimal is 5 or greater', () => {
      const value = 1.555
      const result = NumberPrecision.round(value, 2)

      expect(result).toBe(1.56)
    })

    it('should round down when the next decimal is less than 5', () => {
      const value = 1.554
      const result = NumberPrecision.round(value, 2)

      expect(result).toBe(1.55)
    })

    it('should round to the nearest integer when requested decimals are 0', () => {
      expect(NumberPrecision.round(3.6, 0)).toBe(4)
      expect(NumberPrecision.round(3.4, 0)).toBe(3)
    })

    it('should round to integer part when requested decimals are negative', () => {
      const value = 15.67
      const result = NumberPrecision.round(value, -1)

      expect(result).toBe(16)
    })

    it('should return 0 when the value is NaN', () => {
      const result = NumberPrecision.round(NaN)
      expect(result).toBe(0)
    })

    it('should return 0 when the value is Infinity', () => {
      const result = NumberPrecision.round(Infinity)
      expect(result).toBe(0)
    })

    it('should handle floating point precision issues', () => {
      const value = 1.005
      const result = NumberPrecision.round(value, 2)

      expect(result).toBe(1.01)
    })

    it('should handle floating point numbers correctly', () => {
      const value = 1e-7

      const result = NumberPrecision.round(value, 4)

      expect(result).toBe(0)
    })
  })

  describe('equals', () => {
    it('should return true when values are strictly identical', () => {
      expect(NumberPrecision.equals(1.5, 1.5)).toBe(true)
    })

    it('should return true when the difference is within the default tolerance', () => {
      expect(NumberPrecision.equals(330, 329.99999999)).toBe(true)
      expect(NumberPrecision.equals(1.12345678, 1.123456789)).toBe(true)
    })

    it('should return false when the difference exceeds the default tolerance', () => {
      expect(NumberPrecision.equals(1.12345671, 1.12345672)).toBe(false)
      expect(NumberPrecision.equals(330, 329.9999998)).toBe(false)
    })

    it('should apply dynamic tolerance based on custom decimals parameter', () => {
      expect(NumberPrecision.equals(1.55, 1.59, 2)).toBe(true)
      expect(NumberPrecision.equals(1.5, 1.65, 2)).toBe(false)
    })

    it('should apply correct tolerance when requested decimals are 0', () => {
      expect(NumberPrecision.equals(15.1, 15.11, 1)).toBe(false)
    })

    it('should return false if any value is NaN', () => {
      expect(NumberPrecision.equals(NaN, 1)).toBe(false)
      expect(NumberPrecision.equals(1, NaN)).toBe(false)
      expect(NumberPrecision.equals(NaN, NaN)).toBe(false)
    })

    it('should return false if any value is Infinity or -Infinity', () => {
      expect(NumberPrecision.equals(Infinity, 1)).toBe(false)
      expect(NumberPrecision.equals(1, -Infinity)).toBe(false)
      expect(NumberPrecision.equals(Infinity, Infinity)).toBe(false)
    })
  })
})
