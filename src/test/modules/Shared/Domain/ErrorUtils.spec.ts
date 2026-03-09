import { ErrorUtils } from '~/src/modules/Shared/Domain/ErrorUtils'

describe('ErrorUtils', () => {
  describe('normalize', () => {
    it('should normalize a standard Error instance', () => {
      const message = 'Standard error message'
      const error = new Error(message)

      const result = ErrorUtils.normalize(error)

      expect(result).toEqual({
        message: message,
        stack: error.stack,
      })
      expect(result.stack).toBeDefined()
    })

    it('should normalize a string as an error message', () => {
      const errorString = 'Something went wrong as a string'

      const result = ErrorUtils.normalize(errorString)

      expect(result).toEqual({
        message: errorString,
        stack: undefined,
      })
    })

    it('should normalize an unknown object using JSON stringify', () => {
      const errorObject = { code: 500, detail: 'Server Error' }

      const result = ErrorUtils.normalize(errorObject)

      expect(result).toEqual({
        message: '{"code":500,"detail":"Server Error"}',
        stack: undefined,
      })
    })

    it('should fallback to String() if JSON.stringify fails', () => {
      const circular: any = { prop: 'value' }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      circular.self = circular

      const result = ErrorUtils.normalize(circular)

      expect(result.message).toBe('[object Object]')
      expect(result.stack).toBeUndefined()
    })

    it('should handle null correctly', () => {
      expect(ErrorUtils.normalize(null)).toEqual({
        message: 'null',
        stack: undefined,
      })
    })

    it('should handle undefined correctly', () => {
      expect(ErrorUtils.normalize(undefined)).toEqual({
        message: 'undefined',
        stack: undefined,
      })
    })
  })
})
