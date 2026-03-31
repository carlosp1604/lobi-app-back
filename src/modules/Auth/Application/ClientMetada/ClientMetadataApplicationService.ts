import { DeviceInfo } from '~/src/modules/Auth/Domain/ValueObject/DeviceInfo'
import { ErrorUtils } from '~/src/modules/Shared/Domain/ErrorUtils'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { IpValidatorServiceInterface } from '~/src/modules/Shared/Infrastructure/Services/IpValidatorServiceInterface'
import { UserAgentParserServiceInterface } from '~/src/modules/Shared/Infrastructure/Services/UserAgentParserServiceInterface'
import { ClientMetadataApplicationResponse } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationResponse'
import { ClientMetadataApplicationRequestDto } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationRequestDto'
import { DeviceLocationResolverServiceInterface } from '~/src/modules/Auth/Domain/DeviceLocationResolverServiceInterface'

type ClientMetadataContext = Record<string, unknown>

interface NormalizedIpWithHash {
  normalizedIp: string
  userIpHash: UserIpHash
}

export class ClientMetadataApplicationService {
  constructor(
    private readonly ipValidator: IpValidatorServiceInterface,
    private readonly hasherService: HasherServiceInterface,
    private readonly uaParserService: UserAgentParserServiceInterface,
    private readonly deviceLocationResolver: DeviceLocationResolverServiceInterface,
    private readonly loggerService: LoggerServiceInterface,
  ) {}

  public async process(
    dto: ClientMetadataApplicationRequestDto,
    context: ClientMetadataContext = {},
  ): Promise<ClientMetadataApplicationResponse> {
    const userAgentVO = this.resolveUserAgent(dto.userAgent, context)

    const normalizedIpWithHash = await this.validateAndHashIp(dto.ip, context)

    let deviceLocation: DeviceLocation | null = null

    if (normalizedIpWithHash) {
      deviceLocation = await this.resolveDeviceLocation(normalizedIpWithHash.normalizedIp, context)
    }

    return {
      deviceInfo: userAgentVO,
      userIpHash: normalizedIpWithHash ? normalizedIpWithHash.userIpHash : null,
      deviceLocation,
    }
  }

  private resolveUserAgent(rawUa: string | undefined, context: ClientMetadataContext): DeviceInfo {
    if (!rawUa) {
      this.loggerService.info('UserAgent is missing', context)
      return DeviceInfo.unknown()
    }

    const parsedUserAgent = this.uaParserService.parse(rawUa)
    const userAgentResult = DeviceInfo.safeCreate(parsedUserAgent)

    if (userAgentResult.success) {
      return userAgentResult.value
    }

    this.loggerService.info('UserAgent validation failed', {
      ...context,
      reason: 'Invalid UserAgent',
      uaSample: rawUa.slice(0, 512),
      uaLength: rawUa.length,
    })

    return DeviceInfo.unknown()
  }

  private async validateAndHashIp(rawIp: string | undefined, context: ClientMetadataContext): Promise<NormalizedIpWithHash | null> {
    if (!rawIp) {
      this.loggerService.warn('IP address is missing', context)
      return null
    }

    const isValidIp = this.ipValidator.isValid(rawIp)
    const isPublicIp = isValidIp ? this.ipValidator.isPublic(rawIp) : false

    if (!isValidIp || !isPublicIp) {
      const reason = !isValidIp ? 'IP address is invalid' : 'IP address is private or local'

      this.loggerService.warn('IP address validation failed', {
        ...context,
        reason,
        ipSample: rawIp.slice(0, 39),
        ipLength: rawIp.length,
      })

      return null
    }

    const normalizedIp = this.ipValidator.normalize(rawIp)
    const hashedIp = await this.hasherService.hash(normalizedIp)

    return {
      userIpHash: UserIpHash.fromString(hashedIp),
      normalizedIp,
    }
  }

  private async resolveDeviceLocation(normalizedIp: string, context: ClientMetadataContext): Promise<DeviceLocation | null> {
    try {
      const resolvedDeviceLocation = await this.deviceLocationResolver.resolve(normalizedIp)

      if (!resolvedDeviceLocation) {
        this.loggerService.debug('Device location resolution failed', {
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
        reason: 'Provider error',
        error: normalizedException.message,
      })

      return null
    }
  }
}
