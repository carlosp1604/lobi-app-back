/* eslint @typescript-eslint/unbound-method: 0 */
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { mock, mockReset } from 'jest-mock-extended'
import { TokenGeneratorApplicationServiceInterface } from '~/src/modules/Auth/Application/TokenGenerator/TokenGeneratorApplicationServiceInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { ConfigService } from '@nestjs/config'
import { UserSessionIdMother } from '~/src/test/mothers/UserSessionIdMother'
import { UserSessionTokenHashMother } from '~/src/test/mothers/UserSessionTokenHashMother'
import { GenerateTokensApplicationService } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationService'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { GenerateTokensApplicationResponseDto } from '~/src/modules/Auth/Application/TokenGenerator/GenerateTokensApplicationResponseDto'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'

describe('GenerateTokensApplicationService', () => {
  const mockedIdGenerator = mock<IdGeneratorServiceInterface>()
  const mockedTokenGenerator = mock<TokenGeneratorApplicationServiceInterface>()
  const mockedHasherService = mock<HasherServiceInterface>()
  const mockedConfigService = mock<ConfigService>()

  const sessionId = UserSessionIdMother.valid()
  const userId = UserIdMother.valid()
  const userAgent = UserAgentMother.valid()
  const ipHash = UserSessionIpHashMother.valid()
  const expectedTokenHash = UserSessionTokenHashMother.random()
  const deviceLocation = DeviceLocationMother.valid()

  const now = new Date('2025-10-17T15:26:21Z')

  const expectedAccessExpiresAt = new Date(now.getTime() + 400)
  const expectedRefreshExpiresAt = new Date(now.getTime() + 4000)

  let userSessionTestBuilder = new UserSessionTestBuilder()

  const buildService = () => {
    return new GenerateTokensApplicationService(mockedIdGenerator, mockedTokenGenerator, mockedHasherService, mockedConfigService)
  }

  describe('happy path', () => {
    beforeEach(() => {
      mockReset(mockedIdGenerator)
      mockReset(mockedTokenGenerator)
      mockReset(mockedHasherService)
      mockReset(mockedConfigService)

      mockedIdGenerator.generateId.mockReturnValueOnce(sessionId.toString())
      mockedTokenGenerator.generateAccessToken.mockResolvedValueOnce('expected-jwt-token')
      mockedTokenGenerator.generateSessionToken.mockResolvedValueOnce('expected-refresh-token')
      mockedHasherService.hash.mockResolvedValueOnce(expectedTokenHash.toString())
      mockedConfigService.get.mockImplementation((key: string) => {
        if (key === 'REFRESH_TTL_MS') {
          return 4000
        }
        if (key === 'ACCESS_TTL_MS') {
          return 400
        }
        return undefined
      })

      userSessionTestBuilder = new UserSessionTestBuilder()
        .withId(sessionId)
        .withUserAgent(userAgent)
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .withRevokedAt(null)
        .withExpiresAt(expectedRefreshExpiresAt)
        .withTokenHash(expectedTokenHash)
        .withUserId(userId)
    })

    const checkSession = (result: UserSession, expectedUserSession: UserSession) => {
      expect(result.id.equals(expectedUserSession.id)).toBe(true)
      expect(result.userId.equals(expectedUserSession.userId)).toBe(true)
      expect(result.createdAt.getTime()).toBe(expectedUserSession.createdAt.getTime())
      expect(result.updatedAt.getTime()).toBe(expectedUserSession.updatedAt.getTime())
      expect(result.expiresAt.getTime()).toBe(expectedUserSession.expiresAt.getTime())
      expect(result.revokedAt).toBe(null)
      expect(expectedUserSession.revokedAt).toBe(null)

      if (result.ipHash) {
        expect(expectedUserSession.ipHash).not.toBe(null)
        expect(result.ipHash.equals(expectedUserSession.ipHash)).toBe(true)
      } else {
        expect(result.ipHash).toBe(null)
        expect(expectedUserSession.ipHash).toBe(null)
      }

      if (result.deviceLocation) {
        expect(result.deviceLocation.countryCode).toBe(expectedUserSession.deviceLocation?.countryCode)
        expect(result.deviceLocation.city).toBe(expectedUserSession.deviceLocation?.city)
      } else {
        expect(result.deviceLocation).toBe(null)
        expect(expectedUserSession.deviceLocation).toBe(null)
      }

      expect(result.userAgent.equals(expectedUserSession.userAgent)).toBe(true)
      expect(result.tokenHash.equals(expectedUserSession.tokenHash)).toBe(true)
    }

    const checkResult = (result: GenerateTokensApplicationResponseDto) => {
      expect(result.accessToken).toBe('expected-jwt-token')
      expect(result.accessTokenExpiresAt.getTime()).toBe(expectedAccessExpiresAt.getTime())
      expect(result.refreshToken).toBe('expected-refresh-token')
      expect(result.refreshTokenExpiresAt.getTime()).toBe(expectedRefreshExpiresAt.getTime())
    }

    it('should call services correctly', async () => {
      const service = buildService()

      await service.generate(userId, now, userAgent, null, deviceLocation)

      expect(mockedIdGenerator.generateId).toHaveBeenCalledTimes(1)
      expect(mockedConfigService.get).toHaveBeenCalledTimes(2)
      expect(mockedConfigService.get).toHaveBeenNthCalledWith(1, 'REFRESH_TTL_MS', { infer: true })
      expect(mockedConfigService.get).toHaveBeenNthCalledWith(2, 'ACCESS_TTL_MS', { infer: true })
      expect(mockedTokenGenerator.generateSessionToken).toHaveBeenCalledTimes(1)
      expect(mockedHasherService.hash).toHaveBeenCalledTimes(1)
      expect(mockedHasherService.hash).toHaveBeenCalledWith('expected-refresh-token')
      expect(mockedTokenGenerator.generateAccessToken).toHaveBeenCalledTimes(1)
      expect(mockedTokenGenerator.generateAccessToken).toHaveBeenCalledWith(
        userId.toString(),
        sessionId.toString(),
        expectedAccessExpiresAt,
        now,
      )
    })

    it('should return correct data when deviceLocation and ipHash are not null', async () => {
      const expectedUserSession = userSessionTestBuilder.withDeviceLocation(deviceLocation).withIpHash(ipHash).build()

      const service = buildService()

      const result = await service.generate(userId, now, userAgent, ipHash, deviceLocation)

      checkResult(result)
      checkSession(result.session, expectedUserSession)
    })

    it('should return correct data when deviceLocation and ipHash are null', async () => {
      const expectedUserSession = userSessionTestBuilder.withDeviceLocation(null).withIpHash(null).build()

      const service = buildService()

      const result = await service.generate(userId, now, userAgent, null, null)

      checkResult(result)
      checkSession(result.session, expectedUserSession)
    })
  })

  describe('when there are errors', () => {
    beforeEach(() => {
      mockReset(mockedIdGenerator)
      mockReset(mockedTokenGenerator)
      mockReset(mockedHasherService)
      mockReset(mockedConfigService)
    })

    it('should throw an error if the tokenGenerator service fails', async () => {
      mockedIdGenerator.generateId.mockReturnValueOnce(sessionId.toString())
      mockedConfigService.get.mockReturnValueOnce(4000).mockReturnValueOnce(400)
      mockedTokenGenerator.generateSessionToken.mockImplementation(() => {
        throw Error('TokenGenerator: Unexpected error')
      })
      const service = buildService()

      await expect(service.generate(userId, now, userAgent, null, null)).rejects.toThrow(Error('TokenGenerator: Unexpected error'))
    })

    it('should throw an error if the hasherService service fails', async () => {
      mockedIdGenerator.generateId.mockReturnValueOnce(sessionId.toString())
      mockedConfigService.get.mockReturnValueOnce(4000).mockReturnValueOnce(400)
      mockedTokenGenerator.generateAccessToken.mockResolvedValueOnce('expected-jwt-token')
      mockedTokenGenerator.generateSessionToken.mockResolvedValueOnce('expected-refresh-token')
      mockedHasherService.hash.mockImplementation(() => {
        throw Error('HasherService: Unexpected error')
      })
      const service = buildService()

      await expect(service.generate(userId, now, userAgent, null, null)).rejects.toThrow(Error('HasherService: Unexpected error'))
    })
  })
})
