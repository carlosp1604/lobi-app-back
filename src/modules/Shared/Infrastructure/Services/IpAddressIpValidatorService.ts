import ipaddr, { IPv6 } from 'ipaddr.js'
import { IpValidatorServiceInterface } from '~/src/modules/Shared/Infrastructure/Services/IpValidatorServiceInterface'

export class IpAddressIpValidatorService implements IpValidatorServiceInterface {
  /**
   * Checks whether the given IP address is valid (IPv4 or IPv6)
   * @param ip the IP address to validate
   * @returns true if the IP is valid, otherwise false
   */
  public isValid(ip: string): boolean {
    try {
      ipaddr.parse(ip)
      return true
    } catch {
      return false
    }
  }

  /**
   * Checks whether the given IP address is a public address
   * @param ip the IP address to check
   * @returns true if the IP is public, otherwise false
   */
  public isPublic(ip: string): boolean {
    try {
      let address = ipaddr.parse(ip)

      if (address.kind() === 'ipv6' && (address as IPv6).isIPv4MappedAddress()) {
        address = (address as IPv6).toIPv4Address()
      }

      return address.range() === 'unicast'
    } catch {
      return false
    }
  }

  /**
   * Normalizes the given IP address to a canonical representation
   * @param ip the IP address to normalize
   * @returns the normalized IP string
   */
  public normalize(ip: string): string {
    try {
      const address = ipaddr.parse(ip)

      return address.toNormalizedString()
    } catch {
      return ip
    }
  }
}
