import { IpAddressIpValidatorService } from '~/src/modules/Shared/Infrastructure/Services/IpAddressIpValidatorService'
import ipaddr, { IPv4, IPv6 } from 'ipaddr.js'

describe('IpAddressIpValidatorService', () => {
  let service: IpAddressIpValidatorService

  beforeEach(() => {
    service = new IpAddressIpValidatorService()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
    jest.resetModules()
  })

  describe('isValid', () => {
    it('should return false id ipaddr.parse throws', () => {
      jest.spyOn(ipaddr, 'parse').mockImplementationOnce(() => {
        throw new Error('Something went wrong')
      })

      expect(service.isValid('invalid-ip')).toBe(false)
    })
  })

  describe('isPublic', () => {
    it('should return false if ipaddr.parse throws', () => {
      jest.spyOn(ipaddr, 'parse').mockImplementationOnce(() => {
        throw new Error('Something went wrong')
      })

      expect(service.isPublic('invalid-ip')).toBe(false)
    })

    it('should return true if range returns unicast', () => {
      jest.spyOn(ipaddr, 'parse').mockReturnValueOnce({
        range: () => 'unicast',
        kind: () => 'ipv4',
      } as IPv4)

      expect(service.isPublic('an-ip')).toBe(true)
    })

    it('should return false if range does not return unicast', () => {
      jest.spyOn(ipaddr, 'parse').mockReturnValueOnce({
        range: () => 'private',
        kind: () => 'ipv4',
      } as IPv4)

      expect(service.isPublic('an-ip')).toBe(false)
    })

    it('should use IPv4 when input IP is a public IPv6 IPv4-mapped', () => {
      const toV4 = { range: () => 'unicast', kind: () => 'ipv4' }
      jest.spyOn(ipaddr, 'parse').mockReturnValueOnce({
        kind: () => 'ipv6',
        isIPv4MappedAddress: () => true,
        toIPv4Address: () => toV4,
        range: () => 'private',
      } as unknown as IPv6)

      expect(service.isPublic('a-v6-v4-mapped-ip')).toBe(true)
    })

    it('should use IPv4 when input IP is a private IPv6 IPv4-mapped', () => {
      const toV4 = { range: () => 'private', kind: () => 'ipv4' }
      jest.spyOn(ipaddr, 'parse').mockReturnValueOnce({
        kind: () => 'ipv6',
        isIPv4MappedAddress: () => true,
        toIPv4Address: () => toV4,
        range: () => 'unicast',
      } as unknown as IPv6)

      expect(service.isPublic('a-v6-v4-mapped-ip')).toBe(false)
    })
  })

  describe('normalize', () => {
    it('should return the same input if ipaddr.parse throws', () => {
      jest.spyOn(ipaddr, 'parse').mockImplementationOnce(() => {
        throw new Error('Something went wrong')
      })

      expect(service.normalize('invalid-ip')).toBe('invalid-ip')
    })

    it('should return the correct value', () => {
      jest.spyOn(ipaddr, 'parse').mockReturnValueOnce({
        toNormalizedString: () => 'normalized-ip',
      } as IPv4)

      expect(service.normalize('invalid-ip')).toBe('normalized-ip')
    })
  })
})
