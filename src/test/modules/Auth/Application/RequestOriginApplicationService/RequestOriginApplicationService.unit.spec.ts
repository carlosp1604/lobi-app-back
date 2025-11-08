/* eslint @typescript-eslint/unbound-method: 0 */
import { RequestOriginApplicationService } from '~/src/modules/Auth/Application/RequestOriginApplicationService/RequestOriginApplicationService'
import { mock, mockReset } from 'jest-mock-extended'
import { IpValidatorServiceInterface } from '~/src/modules/Auth/Domain/IpValidatorServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import {
  DeviceLocationResolverServiceInterface,
  ResolvedDeviceLocation,
} from '~/src/modules/Auth/Domain/DeviceLocationResolverServiceInterface'
import { DeviceLocationMother } from '~/src/test/mothers/DeviceLocationMother'
import { UserSessionIpHashMother } from '~/src/test/mothers/UserSessionIpHashMother'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'

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
  const validIpHash = UserSessionIpHashMother.valid()
  const validUA = UserAgentMother.valid()
  const validEmail = UserEmailMother.valid()
  const validIp = 'valid-ip'

  beforeEach(() => {
    mockReset(mockedIpValidator)
    mockReset(mockedLogger)
    mockReset(mockedHasher)
    mockReset(mockedDeviceLocationResolver)
    jest.restoreAllMocks()

    mockedIpValidator.isValid.mockReturnValue(true)
    mockedIpValidator.isPublic.mockReturnValue(true)
    mockedIpValidator.normalize.mockReturnValueOnce('normalized-ip')

    mockedHasher.hash.mockResolvedValue(validIpHash.toString())
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
    it('should call services correctly', async () => {
      const service = buildService()

      await service.process(validIp, validUA.toString(), validEmail)

      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.error).not.toHaveBeenCalled()

      checkCommonAsserts()
    })

    it('should return the correct data', async () => {
      const service = buildService()

      const result = await service.process(validIp, validUA.toString(), validEmail)

      expect(result.ipHash).toBe(validIpHash.toString())
      expect(result.userAgent.equals(validUA)).toBe(true)
      expect(result.normalizedIp).toBe('normalized-ip')
      expect(result.deviceLocation).toEqual(validDeviceLocation)
    })
  })

  describe('when IP or UA are not valid or deviceLocationResolver fails', () => {
    it('should call services correctly and return the correct data services when IP is not valid', async () => {
      const invalidIp = 'invalid-ip-with-an-excessive-length-to-validate-proper-slice'

      mockedIpValidator.isValid.mockReturnValue(false)

      const service = buildService()

      const result = await service.process(invalidIp, validUA.toString(), validEmail)

      expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
      expect(mockedIpValidator.isValid).toHaveBeenCalledTimes(1)

      expect(mockedLogger.error).not.toHaveBeenCalled()
      expect(mockedIpValidator.isPublic).not.toHaveBeenCalled()
      expect(mockedIpValidator.normalize).not.toHaveBeenCalled()
      expect(mockedHasher.hash).not.toHaveBeenCalled()
      expect(mockedDeviceLocationResolver.resolve).not.toHaveBeenCalled()

      expect(mockedIpValidator.isValid).toHaveBeenCalledWith(invalidIp)
      expect(mockedLogger.warn).toHaveBeenCalledWith('Invalid or private IP address', {
        email: validEmail.toString(),
        ipSample: invalidIp.slice(0, 39),
        ipLength: invalidIp.length,
      })

      expect(result.ipHash).toBeNull()
      expect(result.userAgent.equals(validUA)).toBe(true)
      expect(result.normalizedIp).toBeNull()
      expect(result.deviceLocation).toBeNull()
    })

    it('should call services correctly and return the correct data when IP is valid but it is not public', async () => {
      const privateIp = 'private-ip'

      mockedIpValidator.isValid.mockReturnValue(true)
      mockedIpValidator.isPublic.mockReturnValue(false)

      const service = buildService()

      const result = await service.process(privateIp, validUA.toString(), validEmail)

      expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
      expect(mockedIpValidator.isValid).toHaveBeenCalledTimes(1)
      expect(mockedIpValidator.isPublic).toHaveBeenCalledTimes(1)

      expect(mockedLogger.error).not.toHaveBeenCalled()
      expect(mockedIpValidator.normalize).not.toHaveBeenCalled()
      expect(mockedHasher.hash).not.toHaveBeenCalled()
      expect(mockedDeviceLocationResolver.resolve).not.toHaveBeenCalled()

      expect(mockedIpValidator.isValid).toHaveBeenCalledWith(privateIp)
      expect(mockedLogger.warn).toHaveBeenCalledWith('Invalid or private IP address', {
        email: validEmail.toString(),
        ipSample: privateIp.slice(0, 39),
        ipLength: privateIp.length,
      })

      expect(result.ipHash).toBeNull()
      expect(result.userAgent.equals(validUA)).toBe(true)
      expect(result.normalizedIp).toBeNull()
      expect(result.deviceLocation).toBeNull()
    })

    describe('when device location resolver fails', () => {
      const testCase = async () => {
        const service = buildService()

        const result = await service.process(validIp, validUA.toString(), validEmail)

        checkCommonAsserts()

        expect(result.ipHash).toBe(validIpHash.toString())
        expect(result.userAgent.equals(validUA)).toBe(true)
        expect(result.normalizedIp).toBe('normalized-ip')
        expect(result.deviceLocation).toBeNull()
      }

      it('should call services correctly and return the correct data when device location resolver fails', async () => {
        mockedDeviceLocationResolver.resolve.mockImplementation(() => {
          throw Error('Service Error')
        })

        await testCase()

        expect(mockedLogger.warn).not.toHaveBeenCalled()
        expect(mockedLogger.error).toHaveBeenCalledTimes(1)
        expect(mockedLogger.error).toHaveBeenCalledWith(
          'Failed to resolve device location. Session will be created without location data',
          expect.any(String),
          {
            email: validEmail.toString(),
            error: Error('Service Error'),
          },
        )
      })

      it('should call services correctly and return the correct data when device location resolver fails without an error', async () => {
        mockedDeviceLocationResolver.resolve.mockImplementation(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw 'Service Error'
        })

        await testCase()

        expect(mockedLogger.warn).not.toHaveBeenCalled()
        expect(mockedLogger.error).toHaveBeenCalledTimes(1)
        expect(mockedLogger.error).toHaveBeenCalledWith(
          'Failed to resolve device location. Session will be created without location data',
          undefined,
          {
            email: validEmail.toString(),
            error: 'Service Error',
          },
        )
      })
    })

    describe('when user-agent is not valid or is undefined', () => {
      const testCase = async (userAgent: string | undefined) => {
        const service = buildService()

        const result = await service.process(validIp, userAgent, validEmail)

        checkCommonAsserts()

        expect(result.ipHash).toBe(validIpHash.toString())
        expect(result.userAgent.equals(UserAgent.unknown())).toBe(true)
        expect(result.normalizedIp).toBe('normalized-ip')
        expect(result.deviceLocation).toEqual(validDeviceLocation)

        expect(mockedLogger.error).not.toHaveBeenCalled()
        expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
        expect(mockedLogger.warn).toHaveBeenCalledWith('Unparseable UserAgent, falling back to UNKNOWN', {
          email: validEmail.toString(),
          uaSample: userAgent ? userAgent.slice(0, 512) : undefined,
          uaLength: userAgent ? userAgent.length : 0,
        })
      }
      it('should call services correctly and return the correct data when user-agent is not valid', async () => {
        const invalidUA = 'a'.repeat(513)

        await testCase(invalidUA)
      })

      it('should call services correctly and return the correct data when user-agent is undefined', async () => {
        const undefinedUA = undefined

        await testCase(undefinedUA)
      })
    })

    it('should throw error if user agent validation fails with an unexpected error', async () => {
      const service = buildService()

      jest.spyOn(UserAgent, 'fromString').mockImplementationOnce(() => {
        throw Error('Unexpected Error')
      })

      await expect(service.process(validIp, validUA.toString(), validEmail)).rejects.toThrow(Error('Unexpected Error'))
    })
  })
})
