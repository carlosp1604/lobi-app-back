export interface RandomServiceInterface {
  /**
   * Generates a secure random numeric code of a specified length
   * @param length Code length [1-256]
   *
   * @returns A string representing the random numeric code
   * @throws {RangeError} if length is less than 1 or greater than 256
   * @throws {TypeError} if length is not an integer
   */
  getRandomNumericCode(length: number): string
}
