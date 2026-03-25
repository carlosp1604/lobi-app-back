import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { DeviceInfoMother } from '~/src/test/mothers/DeviceInfoMother'
import { UserIpHashMother } from '~/src/test/mothers/Domain/Shared/UserIpHashMother'
import { ConfigService } from '@nestjs/config'
import { NodeIdGeneratorService } from '~/src/modules/Shared/Infrastructure/Services/NodeIdGeneratorService'
import { JWTokenGeneratorApplicationService } from '~/src/modules/Auth/Infrastructure/Services/JWTokenGeneratorApplicationService'
import { HmacHasherService } from '~/src/modules/Auth/Infrastructure/Services/HmacHasherService'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import jwt from 'jsonwebtoken'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { mock, mockReset } from 'jest-mock-extended'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { createConfigServiceMockImplementation } from '~/src/test/utils/ConfigServiceMock'

describe('GenerateTokensApplicationService', () => {
  const now = new Date('2025-10-17T15:26:21Z')
  const userId = IdentifierMother.valid()
  const deviceInfo = DeviceInfoMother.valid()
  const ipHash = UserIpHashMother.valid()

  const deviceLocation = DeviceLocationMother.valid()

  const ACCESS_TTL_MS = env.ACCESS_TTL_MS
  const REFRESH_TTL_MS = env.REFRESH_TTL_MS

  const mockedConfigService = mock<ConfigService>()

  beforeEach(() => {
    mockReset(mockedConfigService)

    mockedConfigService.get.mockImplementation(
      createConfigServiceMockImplementation({
        REFRESH_TTL_MS,
        ACCESS_TTL_MS,
      }),
    )
  })

  const buildService = () => {
    return new GenerateTokensApplicationService(
      new NodeIdGeneratorService(),
      new JWTokenGeneratorApplicationService(env.ACCESS_SECRET, env.ACCESS_ISSUER, env.ACCESS_AUDIENCE),
      new HmacHasherService(env.HASH_SECRET),
      mockedConfigService,
    )
  }

  describe('generate', () => {
    it('should generate a full set of tokens and session data correctly', async () => {
      const service = buildService()

      const result = await service.generate(userId, now, deviceInfo, ipHash, deviceLocation)

      expect(result).toBeTruthy()

      expect(result.accessToken).toEqual(expect.any(String))
      expect(result.refreshToken).toEqual(expect.any(String))

      const expectedAccessExpiresAt = new Date(now.getTime() + ACCESS_TTL_MS)
      const expectedRefreshExpiresAt = new Date(now.getTime() + REFRESH_TTL_MS)
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
          exp: Math.floor((now.getTime() + ACCESS_TTL_MS) / 1000),
        }),
      )
      expect(result.refreshToken.length).toBe(64)
    })

    it('should handle null ipHash and deviceLocation correctly', async () => {
      const service = buildService()

      const result = await service.generate(userId, now, deviceInfo, null, null)

      expect(result.session.ipHash).toBeNull()
      expect(result.session.deviceLocation).toBeNull()
    })
  })
})
