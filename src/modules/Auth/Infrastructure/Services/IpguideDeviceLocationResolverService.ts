import countries from 'i18n-iso-countries'
import { z } from 'zod'
import { ErrorUtils } from '~/src/modules/Shared/Domain/ErrorUtils'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import {
  ResolvedDeviceLocation,
  DeviceLocationResolverServiceInterface,
} from '~/src/modules/Auth/Domain/DeviceLocationResolverServiceInterface'

const IpGuideResponseSchema = z.looseObject({
  location: z
    .looseObject({
      city: z.string(),
      country: z.string(),
    })
    .nullable(),
})

export class IpGuideLocationResolverService implements DeviceLocationResolverServiceInterface {
  constructor(private readonly loggerService: LoggerServiceInterface) {}

  public async resolve(ip: string): Promise<ResolvedDeviceLocation | null> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)

    try {
      const response = await fetch(`https://ip.guide/${ip}`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const locationData = await this.extractLocationData(response, ip)

      if (!locationData) {
        return null
      }

      let countryCode = countries.getAlpha2Code(locationData.country, 'en')

      if (!countryCode) {
        this.loggerService.warn('IP location country mapping failed', {
          ip,
          reason: 'Unrecognized country name mapped to XX fallback',
          unmappedCountry: locationData.country,
        })

        countryCode = 'XX'
      }

      return {
        countryCode,
        city: locationData.city,
      }
    } catch (error: unknown) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        this.loggerService.warn('Failed to resolve IP location', {
          ip,
          reason: 'IP resolve request timed out (1.5s)',
        })

        return null
      }

      const normalizedError = ErrorUtils.normalize(error)

      this.loggerService.error('Failed to resolve IP location', normalizedError.stack, {
        ip,
        reason: 'IpGuide returned an unexpected error',
        error: normalizedError.message,
      })

      return null
    }
  }

  private async extractLocationData(response: Response, ip: string): Promise<{ city: string; country: string } | null> {
    if (!response.ok) {
      this.loggerService.error('Failed to resolve IP location', undefined, {
        ip,
        reason: 'IpGuide returned an error status code',
        status: response.status,
      })

      return null
    }

    const data = (await response.json()) as unknown

    const parsed = IpGuideResponseSchema.safeParse(data)

    if (!parsed.success) {
      this.loggerService.warn('Failed to resolve IP location', {
        ip,
        reason: 'IpGuide returned empty or an unexpected JSON',
        issues: parsed.error.issues,
        payload: data,
      })

      return null
    }

    if (!parsed.data.location) {
      this.loggerService.info('Failed to resolve IP location', {
        ip,
        reason: 'IP Location not found by provider',
      })

      return null
    }

    return {
      city: parsed.data.location.city,
      country: parsed.data.location.country,
    }
  }
}
