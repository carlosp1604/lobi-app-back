/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { IpValidatorServiceInterface } from '~/src/modules/Shared/Infrastructure/Services/IpValidatorServiceInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { UserAgentParserServiceInterface } from '~/src/modules/Shared/Infrastructure/Services/UserAgentParserServiceInterface'
import {
  DeviceLocationResolverServiceInterface,
  ResolvedDeviceLocation,
} from '~/src/modules/Auth/Domain/DeviceLocationResolverServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserIpMother } from '~/src/test/mothers/Infrastructure/UserIpMother'
import { UserIpHashMother } from '~/src/test/mothers/Domain/Shared/UserIpHashMother'
import { DeviceInfoMother } from '~/src/test/mothers/DeviceInfoMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { VerificationTokenPurposeMother } from '~/src/test/mothers/VerificationTokenPurposeMother'
import { ClientMetadataApplicationService } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationService'
import { DeviceInfo } from '~/src/modules/Auth/Domain/ValueObject/DeviceInfo'
import { ParsedUserAgent } from '~/src/modules/Shared/Infrastructure/Services/ParsedUserAgent'
import { ClientMetadataApplicationResponse } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationResponse'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { ClientMetadataApplicationRequestDto } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationRequestDto'
import { UserAgentMother } from '~/src/test/mothers/Infrastructure/UserAgentMother'

describe('ClientMetadataApplicationService', () => {
  const mockedIpValidator = mock<IpValidatorServiceInterface>()
  const mockedHasher = mock<HasherServiceInterface>()
  const mockedUaParser = mock<UserAgentParserServiceInterface>()
  const mockedDeviceLocationResolver = mock<DeviceLocationResolverServiceInterface>()
  const mockedLogger = mock<LoggerServiceInterface>()

  const validIp = UserIpMother.valid()
  const validNormalizedIp = UserIpMother.normalized()
  const privateIp = UserIpMother.private()
  const invalidIp = UserIpMother.invalid()

  const validIpHash = UserIpHashMother.valid()
  const validDeviceInfo = DeviceInfoMother.valid()
  const validDeviceLocation = DeviceLocationMother.valid()
  const expectedResolvedDeviceLocation: ResolvedDeviceLocation = {
    countryCode: validDeviceLocation.countryCode,
    city: validDeviceLocation.city,
  }

  let baseRequestDto: ClientMetadataApplicationRequestDto

  const validEmail = EmailAddressMother.valid().value
  const validTokenPurpose = VerificationTokenPurposeMother.createAccount().value

  const testContext = { email: validEmail, purpose: validTokenPurpose }

  beforeEach(() => {
    mockReset(mockedIpValidator)
    mockReset(mockedHasher)
    mockReset(mockedUaParser)
    mockReset(mockedDeviceLocationResolver)
    mockReset(mockedLogger)
    jest.restoreAllMocks()

    mockedIpValidator.isValid.mockReturnValue(true)
    mockedIpValidator.isPublic.mockReturnValue(true)
    mockedIpValidator.normalize.mockReturnValue(validNormalizedIp)

    mockedHasher.hash.mockResolvedValue(validIpHash.value)

    mockedUaParser.parse.mockReturnValue(validDeviceInfo.value)

    mockedDeviceLocationResolver.resolve.mockResolvedValue(expectedResolvedDeviceLocation)

    baseRequestDto = {
      ip: validIp,
      userAgent: UserAgentMother.valid(),
    }
  })

  const buildService = () => {
    return new ClientMetadataApplicationService(
      mockedIpValidator,
      mockedHasher,
      mockedUaParser,
      mockedDeviceLocationResolver,
      mockedLogger,
    )
  }

  const checkResult = (
    result: ClientMetadataApplicationResponse,
    expectedUA: DeviceInfo,
    expectedIpHash: UserIpHash | null,
    expectedDeviceLocation: DeviceLocation | null,
  ) => {
    expect(result.deviceInfo.equals(expectedUA)).toBe(true)

    if (expectedIpHash) {
      expect(result.userIpHash?.equals(validIpHash)).toBe(true)
    } else {
      expect(result.userIpHash).toBeNull()
    }

    if (expectedDeviceLocation) {
      expect(result.deviceLocation?.equals(validDeviceLocation)).toBe(true)
    } else {
      expect(result.deviceLocation).toBeNull()
    }
  }

  describe('happy path', () => {
    it('should resolve and return metadata when all data is valid', async () => {
      const service = buildService()

      const result = await service.process(baseRequestDto, testContext)

      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.error).not.toHaveBeenCalled()
      expect(mockedLogger.info).not.toHaveBeenCalled()

      checkResult(result, validDeviceInfo, validIpHash, validDeviceLocation)

      expect(mockedIpValidator.isValid).toHaveBeenCalledWith(validIp)
      expect(mockedIpValidator.isPublic).toHaveBeenCalledWith(validIp)
      expect(mockedIpValidator.normalize).toHaveBeenCalledWith(validIp)
      expect(mockedHasher.hash).toHaveBeenCalledWith(validNormalizedIp)
      expect(mockedDeviceLocationResolver.resolve).toHaveBeenCalledWith(validNormalizedIp)
      expect(mockedUaParser.parse).toHaveBeenCalledWith(validDeviceInfo.value.raw)
    })
  })

  describe('user agent resolution', () => {
    it('should return metadata (with unknown user agent) and log info when user agent is missing', async () => {
      const service = buildService()
      const dtoWithMissingUA = { ...baseRequestDto, userAgent: undefined }

      const result = await service.process(dtoWithMissingUA, testContext)

      checkResult(result, DeviceInfoMother.unknown(), validIpHash, validDeviceLocation)

      expect(mockedUaParser.parse).not.toHaveBeenCalled()
      expect(mockedLogger.info).toHaveBeenCalledWith('UserAgent is missing', {
        ...testContext,
      })
    })

    it('should return metadata (with unknown user agent) and log info when user agent is structurally invalid', async () => {
      const service = buildService()
      const maliciousUa = UserAgentMother.invalid()
      const dtoWithMaliciousUA = { ...baseRequestDto, userAgent: maliciousUa }

      mockedUaParser.parse.mockReturnValue({ raw: maliciousUa, browser: {}, os: {}, device: {} } as unknown as ParsedUserAgent)

      const result = await service.process(dtoWithMaliciousUA, testContext)

      checkResult(result, DeviceInfoMother.unknown(), validIpHash, validDeviceLocation)

      expect(mockedLogger.info).toHaveBeenCalledWith('UserAgent validation failed', {
        ...testContext,
        reason: 'Invalid UserAgent',
        uaSample: maliciousUa.slice(0, 512),
        uaLength: maliciousUa.length,
      })
    })
  })

  describe('IP resolution', () => {
    it('should return metadata (with null for IP hash and location), and log warn when IP is missing', async () => {
      const service = buildService()
      const dtoWithMissingIp = { ...baseRequestDto, ip: undefined }

      const result = await service.process(dtoWithMissingIp, testContext)

      checkResult(result, validDeviceInfo, null, null)

      expect(mockedIpValidator.isValid).not.toHaveBeenCalled()
      expect(mockedLogger.warn).toHaveBeenCalledWith('IP address is missing', testContext)
    })

    it('should return metadata (with null for IP hash and location), and log warn when IP is invalid', async () => {
      mockedIpValidator.isValid.mockReturnValue(false)
      const service = buildService()
      const dtoWithInvalidIp = { ...baseRequestDto, ip: invalidIp }

      const result = await service.process(dtoWithInvalidIp, testContext)

      checkResult(result, validDeviceInfo, null, null)

      expect(mockedLogger.warn).toHaveBeenCalledWith('IP address validation failed', {
        ...testContext,
        reason: 'IP address is invalid',
        ipSample: invalidIp,
        ipLength: invalidIp.length,
      })
    })

    it('should return metadata (with null for IP hash and location), and log warn when IP is private', async () => {
      mockedIpValidator.isValid.mockReturnValue(true)
      mockedIpValidator.isPublic.mockReturnValue(false)

      const service = buildService()

      const dtoWithPrivateIp = { ...baseRequestDto, ip: privateIp }

      const result = await service.process(dtoWithPrivateIp, testContext)

      checkResult(result, validDeviceInfo, null, null)

      expect(mockedLogger.warn).toHaveBeenCalledWith('IP address validation failed', {
        ...testContext,
        reason: 'IP address is private or local',
        ipSample: privateIp,
        ipLength: privateIp.length,
      })
    })
  })

  describe('device location resolution', () => {
    it('should return metadata (with null for location) and log debug when location resolver returns null', async () => {
      mockedDeviceLocationResolver.resolve.mockResolvedValue(null)
      const service = buildService()

      const result = await service.process(baseRequestDto, testContext)

      checkResult(result, validDeviceInfo, validIpHash, null)

      expect(mockedLogger.debug).toHaveBeenCalledWith('Device location resolution failed', {
        ...testContext,
        normalizedIp: validNormalizedIp,
        reason: 'IP not found in provider database',
      })
    })

    it('should return metadata (with null for location) and log error when location resolver fails', async () => {
      const error = new Error('GeoIP Service Timeout')
      mockedDeviceLocationResolver.resolve.mockRejectedValue(error)
      const service = buildService()

      const result = await service.process(baseRequestDto, testContext)

      checkResult(result, validDeviceInfo, validIpHash, null)

      expect(mockedLogger.error).toHaveBeenCalledWith('Device location resolution failed', expect.any(String), {
        ...testContext,
        normalizedIp: validNormalizedIp,
        reason: 'Provider error',
        error: error.message,
      })
    })
  })
})
