export interface HasherServiceInterface {
  /**
   * Hashes the given clear text and returns the result encoded in Base64
   * @param clear the plain text value to hash
   * @returns the hashed representation of the value, encoded in Base64
   */
  hash(clear: string): Promise<string>

  /**
   * Compares a clear text value with its hashed counterpart
   * @param clear the plain text value to compare
   * @param hashed the hashed value (Base64 encoded) to compare against
   * @returns true if the values match, otherwise false
   */
  compare(clear: string, hashed: string): Promise<boolean>
}
