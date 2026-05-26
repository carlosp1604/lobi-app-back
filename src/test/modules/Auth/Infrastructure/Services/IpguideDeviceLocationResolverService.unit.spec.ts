/* eslint @typescript-eslint/unbound-method: 0 */
import countries from 'i18n-iso-countries'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { IpGuideLocationResolverService } from '~/src/modules/Auth/Infrastructure/Services/IpguideDeviceLocationResolverService'
import { UserIpMother } from '~/src/test/mothers/Infrastructure/UserIpMother'
import { mock, mockReset } from 'jest-mock-extended'

describe('IpGuideLocationResolverService', () => {
  let service: IpGuideLocationResolverService
  const mockedLogger = mock<LoggerServiceInterface>()

  const validIp = UserIpMother.valid()

  beforeEach(() => {
    mockReset(mockedLogger)
    service = new IpGuideLocationResolverService(mockedLogger)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  const mockFetchResponse = (ok: boolean, jsonBody: unknown, status = 200) => {
    return {
      ok,
      status,
      json: jest.fn().mockResolvedValue(jsonBody),
    } as unknown as Response
  }

  describe('resolve', () => {
    describe('happy path', () => {
      it('should return the location correctly when the API returns valid data', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
          mockFetchResponse(true, {
            location: { city: 'Madrid', country: 'Spain' },
          }),
        )
        const getAlpha2CodeSpy = jest.spyOn(countries, 'getAlpha2Code').mockReturnValue('ES')

        const result = await service.resolve(validIp)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect(fetchSpy).toHaveBeenCalledWith('https://ip.guide/8.8.8.8', { signal: expect.any(AbortSignal) })
        expect(getAlpha2CodeSpy).toHaveBeenCalledWith('Spain', 'en')
        expect(result).toEqual({
          countryCode: 'ES',
          city: 'Madrid',
        })
        expect(mockedLogger.error).not.toHaveBeenCalled()
        expect(mockedLogger.warn).not.toHaveBeenCalled()
        expect(mockedLogger.info).not.toHaveBeenCalled()
      })

      it('should fallback to "XX" country code when cannot resolve the country', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
          mockFetchResponse(true, {
            location: { city: 'UnknownCity', country: 'UnknownCountry' },
          }),
        )
        const getAlpha2CodeSpy = jest.spyOn(countries, 'getAlpha2Code').mockReturnValue(undefined)

        const result = await service.resolve(validIp)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect(fetchSpy).toHaveBeenCalledWith('https://ip.guide/8.8.8.8', { signal: expect.any(AbortSignal) })
        expect(getAlpha2CodeSpy).toHaveBeenCalledWith('UnknownCountry', 'en')
        expect(result).toEqual({
          countryCode: 'XX',
          city: 'UnknownCity',
        })
        expect(mockedLogger.info).not.toHaveBeenCalled()
        expect(mockedLogger.error).not.toHaveBeenCalled()
        expect(mockedLogger.warn).toHaveBeenCalledWith('IP location country mapping failed', {
          ip: validIp,
          reason: 'Unrecognized country name mapped to XX fallback',
          unmappedCountry: 'UnknownCountry',
        })
      })

      it('should return null when API resolves location as null', async () => {
        const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
          mockFetchResponse(true, {
            location: null,
          }),
        )
        const getAlpha2CodeSpy = jest.spyOn(countries, 'getAlpha2Code').mockReturnValue(undefined)

        const result = await service.resolve(validIp)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect(fetchSpy).toHaveBeenCalledWith('https://ip.guide/8.8.8.8', { signal: expect.any(AbortSignal) })
        expect(getAlpha2CodeSpy).not.toHaveBeenCalled()
        expect(result).toBeNull()
        expect(mockedLogger.info).toHaveBeenCalledWith('Failed to resolve IP location', {
          ip: validIp,
          reason: 'IP Location not found by provider',
        })
        expect(mockedLogger.error).not.toHaveBeenCalled()
        expect(mockedLogger.warn).not.toHaveBeenCalled()
      })
    })

    describe('when there are errors', () => {
      it('should return null and log an error when response.ok is false', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue(mockFetchResponse(false, {}, 404))

        const result = await service.resolve(validIp)

        expect(result).toBeNull()
        expect(mockedLogger.info).not.toHaveBeenCalled()
        expect(mockedLogger.warn).not.toHaveBeenCalled()
        expect(mockedLogger.error).toHaveBeenCalledWith('Failed to resolve IP location', undefined, {
          ip: validIp,
          reason: 'IpGuide returned an error status code',
          status: 404,
        })
      })

      it('should return null and log a warning when response validation fails', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue(mockFetchResponse(true, null))

        const result = await service.resolve(validIp)

        expect(result).toBeNull()
        expect(mockedLogger.info).not.toHaveBeenCalled()
        expect(mockedLogger.error).not.toHaveBeenCalled()
        expect(mockedLogger.warn).toHaveBeenCalledWith('Failed to resolve IP location', {
          ip: validIp,
          reason: 'IpGuide returned empty or an unexpected JSON',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          issues: expect.any(Array),
          payload: null,
        })
      })

      it('should normalize and log error when an signal error occurs', async () => {
        const abortError = new Error('The operation was aborted')
        abortError.name = 'AbortError'
        jest.spyOn(global, 'fetch').mockRejectedValue(abortError)

        const result = await service.resolve(validIp)

        expect(result).toBeNull()
        expect(mockedLogger.info).not.toHaveBeenCalled()
        expect(mockedLogger.warn).toHaveBeenCalledWith('Failed to resolve IP location', {
          ip: validIp,
          reason: 'IP resolve request timed out (1.5s)',
        })
        expect(mockedLogger.error).not.toHaveBeenCalled()
      })

      it('should normalize and log error when an unexpected error occurs', async () => {
        const unexpectedError = new Error('Network failure')
        jest.spyOn(global, 'fetch').mockRejectedValue(unexpectedError)

        const result = await service.resolve(validIp)

        expect(result).toBeNull()
        expect(mockedLogger.info).not.toHaveBeenCalled()
        expect(mockedLogger.warn).not.toHaveBeenCalled()
        expect(mockedLogger.error).toHaveBeenCalledWith('Failed to resolve IP location', expect.anything(), {
          ip: validIp,
          reason: 'IpGuide returned an unexpected error',
          error: 'Network failure',
        })
      })
    })
  })
})
