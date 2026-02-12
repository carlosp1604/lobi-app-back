import * as crypto from 'crypto'
import { NodeRandomService } from '~/src/modules/Shared/Infrastructure/Services/NodeRandomService'

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomInt: jest.fn(),
}))

const mockedRandomInt = crypto.randomInt as jest.Mock

describe('NodeRandomService', () => {
  beforeEach(() => {
    mockedRandomInt.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getRandomNumericCode', () => {
    describe('Input Validation', () => {
      it('should throw TypeError if length is not an integer', () => {
        const service = new NodeRandomService()

        const nonIntegerLength = 5.5

        expect(() => service.getRandomNumericCode(nonIntegerLength)).toThrow(
          TypeError('Invalid length: Code length must be an integer'),
        )
      })

      it('should throw RangeError if length is 0', () => {
        const service = new NodeRandomService()

        const zeroLength = 0

        expect(() => service.getRandomNumericCode(zeroLength)).toThrow(RangeError('Invalid length: Code length must be at least 1'))
      })

      it('should throw RangeError if length is negative', () => {
        const service = new NodeRandomService()

        const negativeLength = -5

        expect(() => service.getRandomNumericCode(negativeLength)).toThrow(RangeError('Invalid length: Code length must be at least 1'))
      })

      it('should throw RangeError if length is greater the maximum length (256)', () => {
        const service = new NodeRandomService()

        const excessiveLength = 257

        expect(() => service.getRandomNumericCode(excessiveLength)).toThrow(RangeError('Invalid length: Code length cannot exceed 256'))
      })
    })

    describe('Code Generation', () => {
      it('should call to crypto correctly', () => {
        const service = new NodeRandomService()

        const length = 3

        mockedRandomInt.mockReturnValueOnce(2)
        mockedRandomInt.mockReturnValueOnce(1)
        mockedRandomInt.mockReturnValueOnce(4)

        service.getRandomNumericCode(length)

        expect(mockedRandomInt).toHaveBeenCalledTimes(3)
        expect(mockedRandomInt).toHaveBeenNthCalledWith(1, 0, 10)
        expect(mockedRandomInt).toHaveBeenNthCalledWith(2, 0, 10)
        expect(mockedRandomInt).toHaveBeenNthCalledWith(3, 0, 10)
      })

      it('should return the correct data for the minimum length (1)', () => {
        const service = new NodeRandomService()

        const length = 1

        mockedRandomInt.mockReturnValueOnce(2)

        const code = service.getRandomNumericCode(length)

        expect(code.length).toBe(1)
        expect(code).toBe('2')
      })

      it('should return the correct data for the maximum length (256)', () => {
        const service = new NodeRandomService()

        const length = 256

        for (let i = 0; i < 256; i++) {
          mockedRandomInt.mockReturnValueOnce(2)
        }

        const code = service.getRandomNumericCode(length)

        expect(code.length).toBe(256)
        expect(code).toBe('2'.repeat(256))
      })
    })
  })
})
