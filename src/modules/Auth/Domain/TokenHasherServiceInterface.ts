export interface TokenHasherServiceInterface {
  /**
   * Hashes the given clear text
   * @param clear the plain text value to hash
   * @returns the hashed representation of the value
   */
  hash(clear: string): string

  /**
   * Compares a clear text value with its hashed counterpart
   * @param clear the plain text value to compare
   * @param hashed the hashed value to compare against
   * @returns true if the values match, otherwise false
   */
  compare(clear: string, hashed: string): boolean
}
