export interface IpValidatorServiceInterface {
  /**
   * Checks whether the given IP address is valid (IPv4 or IPv6)
   * @param ip the IP address to validate
   * @returns true if the IP is valid, otherwise false
   */
  isValid(ip: string): boolean

  /**
   * Checks whether the given IP address is a public address
   * @param ip the IP address to check
   * @returns true if the IP is public, otherwise false
   */
  isPublic(ip: string): boolean

  /**
   * Normalizes the given IP address to a canonical representation
   * @param ip the IP address to normalize
   * @returns the normalized IP string
   */
  normalize(ip: string): string
}
