import { IpAddressIpValidatorService } from '~/src/modules/Auth/Infrastructure/Services/IpAddressIpValidatorService'
import fc from 'fast-check'

describe('IpAddressIpValidatorService', () => {
  let service: IpAddressIpValidatorService

  beforeEach(() => {
    service = new IpAddressIpValidatorService()
  })

  describe('isValid', () => {
    const invalidIps = [
      '256.0.0.1',
      '1.2.3.4.5',
      '1234:5678:90ab:cdef:ghij::1',
      '2001:::1',
      '2001:db8::1::1',
      '12345::',
      'abcd',
      '',
      ' ',
      'eduardo',
    ]

    it('should return true when IPv4 is valid', () => {
      fc.assert(
        fc.property(fc.ipV4(), (ipV4) => {
          const result = service.isValid(ipV4)

          expect(result).toBe(true)
        }),
      )
    })

    it('should return true when IPv6 is valid', () => {
      fc.assert(
        fc.property(fc.ipV6(), (ipV6) => {
          const result = service.isValid(ipV6)

          expect(result).toBe(true)
        }),
      )
    })

    it.each(invalidIps)('should return false when IP is not invalid: %s', (notIp) => {
      const result = service.isValid(notIp)

      expect(result).toBe(false)
    })
  })

  describe('isPublic', () => {
    const nonPublicSamples = [
      '10.0.0.1',
      '172.16.0.1',
      '192.168.1.1',
      '127.0.0.1',
      '169.254.1.1',
      '100.64.0.1',
      '224.0.0.1',
      '240.0.0.1',
      '255.255.255.255',
      '0.0.0.0',
      '192.0.2.1',
      '198.51.100.1',
      '203.0.113.1',
      '198.18.0.1',
      '::',
      '::1',
      'fe80::1',
      'fc00::1',
      'ff02::1',
      '2001:db8::1',
    ]

    const publicSamples = ['1.1.1.1', '8.8.8.8', '2001:4860:4860::8888', '2606:4700:4700::1111', '::ffff:8.8.8.8']

    it.each(publicSamples)('should return true when IPv4 is public: %s', (publicIp) => {
      const result = service.isPublic(publicIp)

      expect(result).toBe(true)
    })

    it.each(publicSamples)('isValid should return true when isPublic returns true: %s', (publicIp) => {
      const isPublicResult = service.isPublic(publicIp)
      const isValidResult = service.isValid(publicIp)

      expect(isPublicResult).toBe(true)
      expect(isValidResult).toBe(true)
    })

    it.each(nonPublicSamples)('should return false when IP is private: %s', (nonPublicIp) => {
      const result = service.isPublic(nonPublicIp)

      expect(result).toBe(false)
    })
  })

  describe('normalize', () => {
    it('should return the same IPv4', () => {
      fc.assert(
        fc.property(fc.ipV4(), (ipV4) => {
          const result = service.normalize(ipV4)

          expect(result).toBe(ipV4)
        }),
      )
    })

    it('should normalize IPV6', () => {
      expect(service.normalize('::FFFF:192.0.2.128')).toBe('0:0:0:0:0:ffff:c000:280')
      expect(service.normalize('2001:0DB8:0:0:0:0:2:1')).toBe('2001:db8:0:0:0:0:2:1')
    })

    it('should return the same input if it is not a valid IP', () => {
      expect(service.normalize('not-an-ip')).toBe('not-an-ip')
    })

    it('normalize(normalize(ip)) === normalize(ip) (valid IPv4/IPv6)', () => {
      fc.assert(
        fc.property(fc.oneof(fc.ipV4(), fc.ipV6()), (ip) => {
          const n1 = service.normalize(ip)

          expect(service.normalize(n1)).toBe(n1)
        }),
      )
    })
  })
})
