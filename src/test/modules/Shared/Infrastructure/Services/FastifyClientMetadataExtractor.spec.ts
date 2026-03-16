import { FastifyRequest } from 'fastify'
import { RawClientMetadataDto } from '~/src/modules/Shared/Infrastructure/Services/RawClientMetadataDto'
import { FastifyClientMetadataExtractor } from '~/src/modules/Shared/Infrastructure/Services/FastifyClientMetadataResolver'
import { UserIpMother } from '~/src/test/mothers/Infrastructure/UserIpMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'

describe('FastifyClientMetadataExtractor', () => {
  let extractor: FastifyClientMetadataExtractor

  beforeEach(() => {
    extractor = new FastifyClientMetadataExtractor()
  })

  const createMockRequest = (ip?: string, userAgent?: string): FastifyRequest => {
    return {
      ip,
      headers: {
        ...(userAgent ? { 'user-agent': userAgent } : {}),
      },
    } as unknown as FastifyRequest
  }

  describe('resolve', () => {
    it('should extract IP and user agent when they are present', () => {
      const rawIp = UserIpMother.valid()
      const rawUa = UserAgentMother.validString()
      const request = createMockRequest(rawIp, rawUa)

      const result: RawClientMetadataDto = extractor.extract(request)

      expect(result.ip).toBe(rawIp)
      expect(result.userAgent).toBe(rawUa)
    })

    it('should extract IP and return undefined for user agent when the header is missing', () => {
      const rawIp = UserIpMother.valid()
      const request = createMockRequest(rawIp, undefined)

      const result = extractor.extract(request)

      expect(result.ip).toBe(rawIp)
      expect(result.userAgent).toBeUndefined()
    })

    it('should extract user agent and return undefined for IP when the IP is missing', () => {
      const rawUa = UserAgentMother.validString()
      const request = createMockRequest(undefined, rawUa)

      const result = extractor.extract(request)

      expect(result.ip).toBeUndefined()
      expect(result.userAgent).toBe(rawUa)
    })

    it('should return undefined for both fields when the request has neither IP nor user agent', () => {
      const request = createMockRequest(undefined, undefined)

      const result = extractor.extract(request)

      expect(result.ip).toBeUndefined()
      expect(result.userAgent).toBeUndefined()
    })
  })
})
