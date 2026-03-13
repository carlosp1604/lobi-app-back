import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { IpValidatorServiceInterface } from '~/src/modules/Shared/Infrastructure/Services/IpValidatorServiceInterface'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { DeviceLocationResolverServiceInterface } from '~/src/modules/Auth/Domain/DeviceLocationResolverServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { ErrorUtils } from '~/src/modules/Shared/Domain/ErrorUtils'

interface NormalizedIpWithHash {
  normalizedIp: string
  hashedIp: string
}

type RequestOriginContext = Record<string, unknown>

export interface RequestOriginData {
  userAgent: UserAgent
  ipHash: string | null
  normalizedIp: string | null
  deviceLocation: DeviceLocation | null
}

export class RequestOriginApplicationService {
  constructor(
    private readonly ipValidator: IpValidatorServiceInterface,
    private readonly hasherService: HasherServiceInterface,
    private readonly deviceLocationResolver: DeviceLocationResolverServiceInterface,
    private readonly loggerService: LoggerServiceInterface,
  ) {}

  public async process(ip: string, userAgent: string | undefined, context: RequestOriginContext = {}): Promise<RequestOriginData> {
    const validatedUserAgent = this.validateUserAgent(userAgent, context)

    const validateAndHashIpResult = await this.validateAndHashIp(ip, context)

    if (!validateAndHashIpResult) {
      return { userAgent: validatedUserAgent, ipHash: null, normalizedIp: null, deviceLocation: null }
    }

    const ipHash = validateAndHashIpResult.hashedIp
    const normalizedIp = validateAndHashIpResult.normalizedIp

    const deviceLocation = await this.resolveDeviceLocation(normalizedIp, context)

    return { userAgent: validatedUserAgent, ipHash, normalizedIp, deviceLocation }
  }

  private validateUserAgent(userAgent: string | undefined, context: RequestOriginContext): UserAgent {
    const logAndReturnFallback = () => {
      this.loggerService.warn('UserAgent parsing failed', {
        ...context,
        reason: 'Invalid or missing UserAgent, falling back to UNKNOWN',
        uaSample: userAgent ? userAgent.slice(0, 512) : undefined,
        uaLength: userAgent ? userAgent.length : 0,
      })

      return UserAgent.unknown()
    }

    if (!userAgent) {
      return logAndReturnFallback()
    }

    try {
      return UserAgent.fromProps({
        raw: userAgent,
        os: { name: null, version: null },
        device: { vendor: null, type: null, model: null },
        browser: { version: null, name: null },
      })
    } catch (exception: unknown) {
      if (!(exception instanceof UserSessionDomainException)) {
        throw exception
      }

      return logAndReturnFallback()
    }
  }

  private async validateAndHashIp(ip: string, context: RequestOriginContext): Promise<NormalizedIpWithHash | null> {
    let normalizedIp: string = ip

    if (this.ipValidator.isValid(ip) && this.ipValidator.isPublic(ip)) {
      normalizedIp = this.ipValidator.normalize(ip)

      const hashedIp = await this.hasherService.hash(normalizedIp)

      return {
        normalizedIp,
        hashedIp,
      }
    }

    this.loggerService.warn('IP address validation failed', {
      ...context,
      reason: 'IP is either invalid, private or local',
      ipSample: ip.slice(0, 39),
      ipLength: ip.length,
    })

    return null
  }

  private async resolveDeviceLocation(normalizedIp: string, context: RequestOriginContext): Promise<DeviceLocation | null> {
    try {
      const resolvedDeviceLocation = await this.deviceLocationResolver.resolve(normalizedIp)

      if (!resolvedDeviceLocation) {
        this.loggerService.debug('No location found for the given IP', {
          ...context,
          normalizedIp: normalizedIp,
          reason: 'IP not found in provider database',
        })

        return null
      }

      return DeviceLocation.fromProps({
        city: resolvedDeviceLocation.city,
        countryCode: resolvedDeviceLocation.countryCode,
      })
    } catch (exception: unknown) {
      const normalizedException = ErrorUtils.normalize(exception)

      this.loggerService.error('Device location resolution failed', normalizedException.stack, {
        ...context,
        normalizedIp: normalizedIp,
        error: normalizedException.message,
      })

      return null
    }
  }
}
