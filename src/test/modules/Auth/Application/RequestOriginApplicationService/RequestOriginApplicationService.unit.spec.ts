/* eslint @typescript-eslint/unbound-method: 0 */
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { mock, mockReset } from 'jest-mock-extended'
import { IpValidatorServiceInterface } from '~/src/modules/Shared/Infrastructure/Services/IpValidatorServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import {
  DeviceLocationResolverServiceInterface,
  ResolvedDeviceLocation,
} from '~/src/modules/Auth/Domain/DeviceLocationResolverServiceInterface'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserIpHashMother } from '~/src/test/mothers/Domain/Shared/UserIpHashMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { EmailAddressMother } from '~/src/test/mothers/Domain/Shared/EmailAddressMother'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { VerificationTokenPurpose } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenPurpose'

describe('RequestOriginApplicationService', () => {
  const mockedIpValidator = mock<IpValidatorServiceInterface>()
  const mockedLogger = mock<LoggerServiceInterface>()
  const mockedHasher = mock<HasherServiceInterface>()
  const mockedDeviceLocationResolver = mock<DeviceLocationResolverServiceInterface>()

  const validDeviceLocation = DeviceLocationMother.valid()
  const expectedResolvedDeviceLocation: ResolvedDeviceLocation = {
    countryCode: validDeviceLocation.countryCode,
    city: validDeviceLocation.city,
  }
  const validIpHash = UserIpHashMother.valid()
  const validUA = UserAgentMother.valid()
  const validEmail = EmailAddressMother.valid()
  const validIp = 'valid-ip'
  const purposeCreateAccount = VerificationTokenPurpose.createAccount().value

  beforeEach(() => {
    mockReset(mockedIpValidator)
    mockReset(mockedLogger)
    mockReset(mockedHasher)
    mockReset(mockedDeviceLocationResolver)
    jest.restoreAllMocks()

    mockedIpValidator.isValid.mockReturnValue(true)
    mockedIpValidator.isPublic.mockReturnValue(true)
    mockedIpValidator.normalize.mockReturnValueOnce('normalized-ip')

    mockedHasher.hash.mockResolvedValue(validIpHash.value)
    mockedDeviceLocationResolver.resolve.mockResolvedValue(expectedResolvedDeviceLocation)
  })

  const buildService = () => {
    return new RequestOriginApplicationService(mockedIpValidator, mockedHasher, mockedDeviceLocationResolver, mockedLogger)
  }

  const checkCommonAsserts = () => {
    expect(mockedIpValidator.isValid).toHaveBeenCalledTimes(1)
    expect(mockedIpValidator.isPublic).toHaveBeenCalledTimes(1)
    expect(mockedIpValidator.normalize).toHaveBeenCalledTimes(1)
    expect(mockedHasher.hash).toHaveBeenCalledTimes(1)
    expect(mockedDeviceLocationResolver.resolve).toHaveBeenCalledTimes(1)

    expect(mockedIpValidator.isValid).toHaveBeenCalledWith(validIp)
    expect(mockedIpValidator.isPublic).toHaveBeenCalledWith(validIp)
    expect(mockedIpValidator.normalize).toHaveBeenCalledWith(validIp)
    expect(mockedHasher.hash).toHaveBeenCalledWith('normalized-ip')
    expect(mockedDeviceLocationResolver.resolve).toHaveBeenCalledWith('normalized-ip')
  }

  describe('happy path', () => {
    it('should call with correct arguments and return the correct data', async () => {
      const service = buildService()

      const result = await service.process(validIp, validUA.raw)

      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.error).not.toHaveBeenCalled()
      expect(mockedLogger.debug).not.toHaveBeenCalled()

      expect(result.ipHash).toBe(validIpHash.value)
      expect(result.userAgent.equals(validUA)).toBe(true)
      expect(result.normalizedIp).toBe('normalized-ip')
      expect(result.deviceLocation?.equals(validDeviceLocation)).toBe(true)

      checkCommonAsserts()
    })

    it('should call with correct arguments and return the correct data when deviceLocationResolver returns null', async () => {
      mockedDeviceLocationResolver.resolve.mockResolvedValue(null)

      const service = buildService()

      const result = await service.process(validIp, validUA.raw)

      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.error).not.toHaveBeenCalled()
      expect(mockedLogger.debug).toHaveBeenCalledWith('No location found for the given IP', {
        normalizedIp: 'normalized-ip',
        reason: 'IP not found in provider database',
      })

      expect(result.ipHash).toBe(validIpHash.value)
      expect(result.userAgent.equals(validUA)).toBe(true)
      expect(result.normalizedIp).toBe('normalized-ip')
      expect(result.deviceLocation).toBeNull()

      checkCommonAsserts()
    })
  })

  describe('when IP or UA are not valid or deviceLocationResolver fails', () => {
    it('should call services with correct arguments and return the correct data when IP is not valid', async () => {
      const invalidIp = 'invalid-ip-with-an-excessive-length-to-validate-proper-slice'

      mockedIpValidator.isValid.mockReturnValue(false)

      const service = buildService()

      const result = await service.process(invalidIp, validUA.raw, { email: validEmail.value })

      expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
      expect(mockedIpValidator.isValid).toHaveBeenCalledTimes(1)

      expect(mockedLogger.error).not.toHaveBeenCalled()
      expect(mockedLogger.debug).not.toHaveBeenCalled()
      expect(mockedIpValidator.isPublic).not.toHaveBeenCalled()
      expect(mockedIpValidator.normalize).not.toHaveBeenCalled()
      expect(mockedHasher.hash).not.toHaveBeenCalled()
      expect(mockedDeviceLocationResolver.resolve).not.toHaveBeenCalled()

      expect(mockedIpValidator.isValid).toHaveBeenCalledWith(invalidIp)
      expect(mockedLogger.warn).toHaveBeenCalledWith('IP address validation failed', {
        reason: 'IP is either invalid, private or local',
        email: validEmail.value,
        ipSample: invalidIp.slice(0, 39),
        ipLength: invalidIp.length,
      })

      expect(result.ipHash).toBeNull()
      expect(result.userAgent.equals(validUA)).toBe(true)
      expect(result.normalizedIp).toBeNull()
      expect(result.deviceLocation).toBeNull()
    })

    it('should call services with correct arguments and return the correct data when IP is valid but it is not public', async () => {
      const privateIp = 'private-ip'

      mockedIpValidator.isValid.mockReturnValue(true)
      mockedIpValidator.isPublic.mockReturnValue(false)

      const service = buildService()

      const result = await service.process(privateIp, validUA.raw)

      expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
      expect(mockedIpValidator.isValid).toHaveBeenCalledTimes(1)
      expect(mockedIpValidator.isPublic).toHaveBeenCalledTimes(1)

      expect(mockedLogger.error).not.toHaveBeenCalled()
      expect(mockedLogger.debug).not.toHaveBeenCalled()
      expect(mockedIpValidator.normalize).not.toHaveBeenCalled()
      expect(mockedHasher.hash).not.toHaveBeenCalled()
      expect(mockedDeviceLocationResolver.resolve).not.toHaveBeenCalled()

      expect(mockedIpValidator.isValid).toHaveBeenCalledWith(privateIp)
      expect(mockedLogger.warn).toHaveBeenCalledWith('IP address validation failed', {
        reason: 'IP is either invalid, private or local',
        ipSample: privateIp.slice(0, 39),
        ipLength: privateIp.length,
      })

      expect(result.ipHash).toBeNull()
      expect(result.userAgent.equals(validUA)).toBe(true)
      expect(result.normalizedIp).toBeNull()
      expect(result.deviceLocation).toBeNull()
    })

    it('should call services with correct arguments and return the correct data when device location resolver fails', async () => {
      const serviceError = new Error('Service Error')
      mockedDeviceLocationResolver.resolve.mockImplementation(() => {
        throw serviceError
      })

      const service = buildService()

      const result = await service.process(validIp, validUA.raw, { email: validEmail })

      checkCommonAsserts()

      expect(result.ipHash).toBe(validIpHash.value)
      expect(result.userAgent.equals(validUA)).toBe(true)
      expect(result.normalizedIp).toBe('normalized-ip')
      expect(result.deviceLocation).toBeNull()

      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.debug).not.toHaveBeenCalled()
      expect(mockedLogger.error).toHaveBeenCalledTimes(1)
      expect(mockedLogger.error).toHaveBeenCalledWith('Device location resolution failed', expect.any(String), {
        email: validEmail,
        normalizedIp: 'normalized-ip',
        error: serviceError.message,
      })
    })

    describe('when user-agent is not valid or is undefined', () => {
      const testCase = async (userAgent: string | undefined) => {
        const service = buildService()

        const result = await service.process(validIp, userAgent, {
          email: validEmail.value,
          purpose: purposeCreateAccount,
        })

        checkCommonAsserts()

        expect(result.ipHash).toBe(validIpHash.value)
        expect(result.userAgent.equals(UserAgent.unknown())).toBe(true)
        expect(result.normalizedIp).toBe('normalized-ip')
        expect(result.deviceLocation).toEqual(validDeviceLocation)

        expect(mockedLogger.error).not.toHaveBeenCalled()
        expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
        expect(mockedLogger.warn).toHaveBeenCalledWith('UserAgent parsing failed', {
          reason: 'Invalid or missing UserAgent, falling back to UNKNOWN',
          email: validEmail.value,
          purpose: purposeCreateAccount,
          uaSample: userAgent ? userAgent.slice(0, 512) : undefined,
          uaLength: userAgent ? userAgent.length : 0,
        })
      }
      it('should call services with correct arguments and return the correct data when user-agent is not valid', async () => {
        const invalidUA = 'a'.repeat(513)

        await testCase(invalidUA)
      })

      it('should call services with correct arguments and return the correct data when user-agent is undefined', async () => {
        const undefinedUA = undefined

        await testCase(undefinedUA)
      })
    })

    it('should throw error if user agent validation fails with a non-domain exception', async () => {
      const unexpectedError = new Error('Unexpected error')
      const service = buildService()

      jest.spyOn(UserAgent, 'fromProps').mockImplementationOnce(() => {
        throw unexpectedError
      })

      await expect(service.process(validIp, validUA.raw)).rejects.toThrow(unexpectedError)
      expect(mockedLogger.error).not.toHaveBeenCalled()
      expect(mockedLogger.debug).not.toHaveBeenCalled()
      expect(mockedLogger.warn).not.toHaveBeenCalled()
    })
  })
})
