import fc from 'fast-check'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'

describe('StringFormatter', () => {
  describe('formatSafe', () => {
    it('should return an empty string if input is null or undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(StringFormatter.formatSafe(null as any, 10)).toBe('')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(StringFormatter.formatSafe(undefined as any, 10)).toBe('')
    })

    it('should replace carriage returns and newlines with a single space', () => {
      const input = 'line1\nline2\rline3\r\nline4'
      const result = StringFormatter.formatSafe(input, 100)

      expect(result).not.toContain('\n')
      expect(result).not.toContain('\r')
      expect(result).toBe('line1 line2 line3 line4')
    })

    it('should truncate strings that exceed maxLength and append a suffix', () => {
      const input = 'This is a very long string'
      const maxLength = 10

      const result = StringFormatter.formatSafe(input, maxLength)

      const suffix = '...[TRUNCATED]'
      expect(result).toBe(`This is a ${suffix}`)
      expect(result.length).toBe(maxLength + suffix.length)
    })

    it('should not truncate if string length is exactly maxLength', () => {
      const input = '12345'
      const result = StringFormatter.formatSafe(input, 5)

      expect(result).toBe('12345')
    })

    it('should handle non-string inputs gracefully by converting them to string', () => {
      const input = 123456789
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = StringFormatter.formatSafe(input as any, 5)

      expect(result).toBe('12345...[TRUNCATED]')
    })

    it('should never return a string that starts with newlines even if truncated', () => {
      const input = '\n\n\nImportantData'
      const result = StringFormatter.formatSafe(input, 5)

      expect(result).toBe(' Impo...[TRUNCATED]')
    })

    it('should return strings that never contains CRLF', () => {
      fc.assert(
        fc.property(fc.string(), fc.integer({ min: 1, max: 1000 }), (input, maxLength) => {
          const result = StringFormatter.formatSafe(input, maxLength)
          expect(result).not.toMatch(/[\r\n]/)
        }),
      )
    })
  })
})
