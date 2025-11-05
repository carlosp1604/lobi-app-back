import * as crypto from 'crypto'
import { RandomServiceInterface } from '~/src/modules/Shared/Domain/RandomServiceInterface'

export class NodeRandomService implements RandomServiceInterface {
  private readonly MAX_CODE_LENGTH = 256

  /**
   * Generates a secure random numeric code of a specified length
   * @param length Code length [1-256]
   *
   * @returns A string representing the random numeric code
   * @throws {RangeError} if length is less than 1 or greater than 256
   * @throws {TypeError} if length is not an integer
   */
  public getRandomNumericCode(length: number): string {
    if (!Number.isInteger(length)) {
      throw new TypeError('Invalid length: Code length must be an integer')
    }

    if (length < 1) {
      throw new RangeError('Invalid length: Code length must be at least 1')
    }

    if (length > this.MAX_CODE_LENGTH) {
      throw new RangeError(`Invalid length: Code length cannot exceed ${this.MAX_CODE_LENGTH}`)
    }

    let code = ''
    for (let i = 0; i < length; i++) {
      code += crypto.randomInt(0, 10).toString()
    }

    return code
  }
}
