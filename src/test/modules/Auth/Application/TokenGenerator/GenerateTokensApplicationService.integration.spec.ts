import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { ConfigService } from '@nestjs/config'
import { NodeIdGeneratorService } from '~/src/modules/Shared/Infrastructure/Services/NodeIdGeneratorService'
import { JWTokenGeneratorApplicationService } from '~/src/modules/Auth/Infrastructure/Services/JWTokenGeneratorApplicationService'
import { NodeHasherService } from '~/src/modules/Auth/Infrastructure/Services/NodeHasherService'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import jwt from 'jsonwebtoken'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { mock, mockReset } from 'jest-mock-extended'

describe('GenerateTokensApplicationService', () => {
  const now = new Date('2025-10-17T15:26:21Z')
  const userId = UserIdMother.valid()
  const userAgent = UserAgentMother.valid()
  const ipHash = UserSessionIpHashMother.valid()

  const deviceLocation = DeviceLocationMother.valid()

  const MOCK_ACCESS_TTL_MS = 900000
  const MOCK_REFRESH_TTL_MS = 604800000

  const mockedConfigService = mock<ConfigService>()

  beforeEach(() => {
    mockReset(mockedConfigService)

    mockedConfigService.get.mockImplementation((key: string) => {
      if (key === 'REFRESH_TTL_MS') {
        return MOCK_REFRESH_TTL_MS
      }
      if (key === 'ACCESS_TTL_MS') {
        return MOCK_ACCESS_TTL_MS
      }
      return null
    })
  })

  const buildService = () => {
    return new GenerateTokensApplicationService(
      new NodeIdGeneratorService(),
      new JWTokenGeneratorApplicationService('test-secret', 'test-issuer', 'test-audience'),
      new NodeHasherService('tests-hash-secret'),
      mockedConfigService,
    )
  }

  describe('generate', () => {
    it('should generate a full set of tokens and session data correctly', async () => {
      const service = buildService()

      const result = await service.generate(userId, now, userAgent, ipHash, deviceLocation)

      expect(result).toBeTruthy()

      expect(result.accessToken).toEqual(expect.any(String))
      expect(result.refreshToken).toEqual(expect.any(String))

      const expectedAccessExpiresAt = new Date(now.getTime() + MOCK_ACCESS_TTL_MS)
      const expectedRefreshExpiresAt = new Date(now.getTime() + MOCK_REFRESH_TTL_MS)
      expect(result.accessTokenExpiresAt).toEqual(expectedAccessExpiresAt)
      expect(result.refreshTokenExpiresAt).toEqual(expectedRefreshExpiresAt)

      expect(result.session).toBeInstanceOf(UserSession)
      expect(result.session.userId.equals(userId)).toBe(true)
      expect(result.session.deviceLocation?.city).toBe(deviceLocation.city)
      expect(result.session.deviceLocation?.countryCode).toBe(deviceLocation.countryCode)
      expect(result.session.ipHash?.equals(ipHash)).toBe(true)

      const decodedToken = jwt.decode(result.accessToken)
      expect(decodedToken).toEqual(
        expect.objectContaining({
          sub: userId.toString(),
          sid: result.session.id.toString(),
          iat: Math.floor(now.getTime() / 1000),
          exp: Math.floor((now.getTime() + MOCK_ACCESS_TTL_MS) / 1000),
        }),
      )
      expect(result.refreshToken.length).toBe(64)
    })

    it('should handle null ipHash and deviceLocation correctly', async () => {
      const service = buildService()

      const result = await service.generate(userId, now, userAgent, null, null)

      expect(result.session.ipHash).toBeNull()
      expect(result.session.deviceLocation).toBeNull()
    })
  })
})
