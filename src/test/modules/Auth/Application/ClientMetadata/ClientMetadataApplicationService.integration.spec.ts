import { mock, mockReset } from 'jest-mock-extended'
import { DeviceLocationResolverServiceInterface } from '~/src/modules/Auth/Domain/DeviceLocationResolverServiceInterface'
import { ClientMetadataApplicationService } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationService'
import { IpAddressIpValidatorService } from '~/src/modules/Shared/Infrastructure/Services/IpAddressIpValidatorService'
import { HmacHasherService } from '~/src/modules/Auth/Infrastructure/Services/HmacHasherService'
import { env } from '~/src/modules/Shared/Infrastructure/env.loader'
import { UaParserJsUserAgentParserService } from '~/src/modules/Shared/Infrastructure/Services/UaParserJsUserAgentParserService'
import { LoggerServiceMock } from '~/src/test/utils/LoggerServiceMock'
import { UserIpMother } from '~/src/test/mothers/Infrastructure/UserIpMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { ClientMetadataApplicationRequestDto } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationRequestDto'

describe('ClientMetadataApplicationService', () => {
  const mockedDeviceLocationResolver = mock<DeviceLocationResolverServiceInterface>()
  const hasherService = new HmacHasherService(env.HASH_SECRET)

  const publicIp = UserIpMother.valid()
  const privateIp = UserIpMother.private()
  const validUa = UserAgentMother.valid()
  const context = { integrationTest: true }

  let baseRequestDto: ClientMetadataApplicationRequestDto

  beforeEach(() => {
    mockReset(mockedDeviceLocationResolver)

    baseRequestDto = {
      ip: publicIp,
      userAgent: validUa.value.raw,
    }
  })

  const buildService = () => {
    return new ClientMetadataApplicationService(
      new IpAddressIpValidatorService(),
      hasherService,
      new UaParserJsUserAgentParserService(),
      mockedDeviceLocationResolver,
      new LoggerServiceMock(),
    )
  }

  describe('happy path', () => {
    it('should return the correct data when input (IP and user agent) is valid', async () => {
      const service = buildService()

      const validDeviceLocation = DeviceLocationMother.valid()
      mockedDeviceLocationResolver.resolve.mockResolvedValue({
        countryCode: validDeviceLocation.countryCode,
        city: validDeviceLocation.city,
      })

      const result = await service.process(baseRequestDto, context)

      const expectedIpHash = await hasherService.hash(publicIp)

      expect(result.userAgent.equals(validUa)).toBe(true)

      expect(result.userIpHash).not.toBeNull()
      expect(result.userIpHash?.value).toBe(expectedIpHash)

      expect(result.deviceLocation?.equals(validDeviceLocation)).toBe(true)
    })

    it('should return null for IP and device location when input IP is private', async () => {
      const service = buildService()

      const dtoWithPrivateIp = { ...baseRequestDto, ip: privateIp }

      const result = await service.process(dtoWithPrivateIp, context)

      expect(result.userAgent.equals(validUa)).toBe(true)
      expect(result.userIpHash).toBeNull()
      expect(result.deviceLocation).toBeNull()
    })

    it('should return unknown user agent when input user agent is not valid', async () => {
      const service = buildService()

      mockedDeviceLocationResolver.resolve.mockResolvedValue(null)

      const invalidUa = UserAgentMother.invalid()
      const dtoWithInvalidUa = { ...baseRequestDto, userAgent: invalidUa }

      const result = await service.process(dtoWithInvalidUa, context)

      const expectedIpHash = await hasherService.hash(publicIp)

      expect(result.userAgent.equals(UserAgentMother.unknown())).toBe(true)

      expect(result.userIpHash).not.toBeNull()
      expect(result.userIpHash?.value).toBe(expectedIpHash)

      expect(result.deviceLocation).toBeNull()
    })
  })
})
