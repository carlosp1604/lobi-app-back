import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { NumericValue } from '~/src/modules/Shared/Domain/ValueObject/NumericValue'
import { NumericValueMother } from '~/src/test/mothers/Domain/Shared/NumericValueMother'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

class DummyVO extends ValueObject<number> {}

describe('NumericValue', () => {
  describe('safeCreate', () => {
    it('should return success when value is valid', () => {
      const validNumericValues = Array.from({ length: 100 }, () => {
        return NumericValueMother.randomValue(true)
      })

      validNumericValues.forEach((validValue) => {
        const result = NumericValue.safeCreate(validValue)

        expect(result.success).toBe(true)
        if (result.success) {
          const magnitude = result.value
          expect(magnitude.numericValue).toBe(validValue)
        }
      })
    })

    it('should truncate the value when input has more decimals than the default precision', () => {
      const input = 1.1234567891
      const result = NumericValue.safeCreate(input)

      expect(result.success).toBe(true)
      if (result.success) {
        const magnitude = result.value
        expect(magnitude.numericValue).toBe(1.12345678)
      }
    })

    it('should preserve the value when input has fewer decimals than the default precision', () => {
      const input = 1.12
      const result = NumericValue.safeCreate(input)

      expect(result.success).toBe(true)
      if (result.success) {
        const magnitude = result.value
        expect(magnitude.numericValue).toBe(1.12)
      }
    })

    it.each(NumericValueMother.INVALID_VALUES)('should return fail when value is invalid: %s', (invalidValue) => {
      const result = NumericValue.safeCreate(invalidValue)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toStrictEqual(
          SharedDomainException.invalidNumericValue(
            invalidValue,
            NumericValue.MIN_DECIMALS,
            NumericValue.MAX_DECIMALS,
            NumericValue.DEFAULT_DECIMALS,
          ),
        )
      }
    })
  })

  describe('fromValue', () => {
    it('should not throw when value is valid', () => {
      const validNumericValues = Array.from({ length: 100 }, () => {
        return NumericValueMother.randomValue(true)
      })

      validNumericValues.forEach((validValue) => {
        expect(() => NumericValue.fromValue(validValue)).not.toThrow()
      })
    })

    it.each(NumericValueMother.INVALID_VALUES)('should throw error when value is invalid: %s', (invalidValue) => {
      expect(() => NumericValue.fromValue(invalidValue)).toThrow()
    })
  })

  describe('equals', () => {
    it('should return false when valueObjects values are equal but their types are different', () => {
      const precision = NumericValue.DEFAULT_DECIMALS
      const randomValue = NumericValueMother.randomValue(true, precision)

      const dummy = new DummyVO(randomValue)
      const numericValue = NumericValue.fromValue(randomValue)

      expect(numericValue.equals(dummy as unknown as NumericValue)).toBe(false)
    })

    it('should return true when values are strictly identical', () => {
      const precision = NumericValue.DEFAULT_DECIMALS
      const randomValue = NumericValueMother.randomValue(true, precision)

      const numericValue1 = NumericValue.fromValue(randomValue)
      const numericValue2 = NumericValue.fromValue(randomValue)

      expect(numericValue1.equals(numericValue2)).toBe(true)
    })

    describe('strict equality', () => {
      it('should return true when values are identical', () => {
        const numericValue1 = NumericValue.fromValue(15.12345678)
        const numericValue2 = NumericValue.fromValue(15.12345678)

        expect(numericValue1.equals(numericValue2)).toBe(true)
      })

      it('should return false when the difference is at the 8th decimal', () => {
        const numericValue1 = NumericValue.fromValue(329.99999998)
        const numericValue2 = NumericValue.fromValue(329.99999999)

        expect(numericValue1.equals(numericValue2)).toBe(false)
      })

      it('should return true when two different inputs truncate to the same 8 decimals', () => {
        const numericValue1 = NumericValue.fromValue(1.123456781)
        const numericValue2 = NumericValue.fromValue(1.123456789)

        expect(numericValue1.equals(numericValue2)).toBe(true)
      })
    })

    it('should return false when comparing with null or undefined', () => {
      const magnitude = NumericValueMother.valid()

      expect(magnitude.equals(null)).toBe(false)
      expect(magnitude.equals(undefined)).toBe(false)
    })
  })

  describe('round', () => {
    const baseNumericValue = NumericValue.fromValue(1.555)

    it('should round up when the next decimal is 5 or greater', () => {
      expect(baseNumericValue.round(2)).toBe(1.56)
    })

    it('should round down when the next decimal is less than 5', () => {
      const numericValue = NumericValue.fromValue(1.554)
      expect(numericValue.round(2)).toBe(1.55)
    })

    it('should round up an integer when requested decimals are 0 and first decimal is 5 or greater', () => {
      expect(baseNumericValue.round(0)).toBe(2)
    })

    it('should round up an integer when requested decimals are 0 and first decimal is less than 5', () => {
      const numericValue = NumericValue.fromValue(1.45)

      expect(numericValue.round(0)).toBe(1)
    })

    it('should work with negative numbers', () => {
      const negativeMagnitude = NumericValue.fromValue(-1.559)
      expect(negativeMagnitude.round(2)).toBe(-1.56)
    })
  })

  describe('truncate', () => {
    const baseNumericValue = NumericValue.fromValue(1.559)

    it('should truncate and discard remaining decimals without rounding up', () => {
      expect(baseNumericValue.truncate(2)).toBe(1.55)
    })

    it('should truncate and preserve the integer part when requested decimals are 0 and first decimal is 5 or greater', () => {
      expect(baseNumericValue.truncate(0)).toBe(1)
    })

    it('should truncate and preserve the integer part when requested decimals are 0 and first decimal is less than 5', () => {
      const numericValue = NumericValue.fromValue(1.45)

      expect(numericValue.truncate(0)).toBe(1)
    })

    it('should return an integer truncated correctly when requested decimals are 0', () => {
      expect(baseNumericValue.truncate(0)).toBe(1)
    })

    it('should work with negative numbers', () => {
      const negativeMagnitude = NumericValue.fromValue(-1.559)
      expect(negativeMagnitude.truncate(2)).toBe(-1.55)
    })
  })

  describe('arithmetic operations', () => {
    const valueA = NumericValue.fromValue(10.5)
    const valueB = NumericValue.fromValue(5.25)

    it('should add two NumericValues correctly', () => {
      const result = valueA.add(valueB)
      expect(result.numericValue).toBe(15.75)
    })

    it('should subtract two NumericValues correctly', () => {
      const result = valueA.subtract(valueB)
      expect(result.numericValue).toBe(5.25)
    })

    it('should multiply two NumericValues correctly', () => {
      const result = valueA.multiply(valueB)
      expect(result.numericValue).toBe(55.125)
    })

    it('should divide two NumericValues correctly', () => {
      const result = valueA.divide(valueB)
      expect(result.numericValue).toBe(2)
    })

    it('should throw error when dividing by zero', () => {
      const zero = NumericValue.fromValue(0)
      expect(() => valueA.divide(zero)).toThrow(SharedDomainException.cannotDivideMagnitudeByZero())
    })

    it('should truncate the result of an operation when it exceeds 8 decimals', () => {
      const numericValue1 = NumericValue.fromValue(1.11111111)
      const numericValue2 = NumericValue.fromValue(1.11111111)

      // eslint-disable-next-line no-loss-of-precision
      expect(1.11111111 * 1.11111111).toBe(1.2345678987654321)

      const result = numericValue1.multiply(numericValue2)
      expect(result.numericValue).toBe(1.23456789)
    })
  })

  describe('comparison', () => {
    const big = NumericValue.fromValue(100)
    const small = NumericValue.fromValue(10)
    const same = NumericValue.fromValue(100)

    it('greaterThan should work correctly', () => {
      expect(big.greaterThan(small)).toBe(true)
      expect(small.greaterThan(big)).toBe(false)
      expect(big.greaterThan(same)).toBe(false)
    })

    it('greaterOrEqualThan should work correctly', () => {
      expect(big.greaterOrEqualThan(small)).toBe(true)
      expect(big.greaterOrEqualThan(same)).toBe(true)
      expect(small.greaterOrEqualThan(big)).toBe(false)
    })

    it('lessThan should work correctly', () => {
      expect(small.lessThan(big)).toBe(true)
      expect(big.lessThan(small)).toBe(false)
      expect(small.lessThan(same)).toBe(true)
    })

    it('lessOrEqualThan should work correctly', () => {
      expect(small.lessOrEqualThan(big)).toBe(true)
      expect(small.lessOrEqualThan(small)).toBe(true)
      expect(big.lessOrEqualThan(small)).toBe(false)
    })
  })

  describe('integerPart', () => {
    it('integerPart should return only the integer including sign', () => {
      const positive = NumericValue.fromValue(123.456)
      const negative = NumericValue.fromValue(-123.456)

      expect(positive.integerPart()).toBe(123)
      expect(negative.integerPart()).toBe(-123)
    })

    it('integerPart should return the same result as truncate(0)', () => {
      const numericValue = NumericValue.fromValue(1604.99)
      const truncateResult = numericValue.truncate(0)
      const integerPartResult = numericValue.integerPart()

      expect(truncateResult).toBe(integerPartResult)
    })
  })

  describe('decimal part', () => {
    it('decimalPart should return only the decimals with default precision', () => {
      const numericValue = NumericValue.fromValue(123.456)
      expect(numericValue.decimalPart()).toBe(0.456)
    })

    it('decimalPart should maintain sign for negative numbers', () => {
      const negative = NumericValue.fromValue(-123.456)
      expect(negative.decimalPart()).toBe(-0.456)
    })

    it('decimalPart should return the same result as getting integer part and subtract from numeric value (avoid noise)', () => {
      const numericValue = NumericValue.fromValue(1604.99)
      const integerPart = numericValue.integerPart()
      const integerPartNumericValue = NumericValue.fromValue(integerPart)

      const result = numericValue.subtract(integerPartNumericValue)

      expect(result.numericValue).toBe(0.99)
      expect(numericValue.decimalPart()).toBe(0.99)

      const noise = 1604.99 - 1604
      expect(noise).toBeCloseTo(0.99, 10)
      expect(noise).not.toBe(0.99)
      expect(noise).toBe(0.9900000000000091)
    })
  })
})
