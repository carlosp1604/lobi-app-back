import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'

export type DeviceInfoProps = {
  raw: string
  browser: {
    name: string | null
    version: string | null
  }
  os: {
    name: string | null
    version: string | null
  }
  hardware: {
    type: string | null
    vendor: string | null
    model: string | null
  }
}

export class DeviceInfo extends ValueObject<DeviceInfoProps> {
  private __brand = 'DeviceInfo' as const

  private constructor(props: DeviceInfoProps) {
    super(props)
  }

  public static fromProps(props: DeviceInfoProps): DeviceInfo {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static safeCreate(props: DeviceInfoProps): Result<DeviceInfo, UserSessionDomainException> {
    const normalizedRaw = props.raw.trim()

    if (!normalizedRaw) {
      return success(this.unknown())
    }

    if (!this.isValidRaw(normalizedRaw)) {
      return fail(UserSessionDomainException.invalidDeviceInfo(normalizedRaw))
    }

    return success(
      new DeviceInfo({
        ...props,
        raw: normalizedRaw,
      }),
    )
  }

  public static unknown(): DeviceInfo {
    return new DeviceInfo({
      raw: 'Unknown',
      browser: { name: null, version: null },
      os: { name: null, version: null },
      hardware: { type: null, vendor: null, model: null },
    })
  }

  get raw(): string {
    return this.value.raw
  }

  get browser(): DeviceInfoProps['browser'] {
    return this.value.browser
  }

  get os(): DeviceInfoProps['os'] {
    return this.value.os
  }

  get hardware(): DeviceInfoProps['hardware'] {
    return this.value.hardware
  }

  public equals(vo?: DeviceInfo | null): boolean {
    if (vo === null || vo === undefined) {
      return false
    }

    if (vo.constructor !== this.constructor) {
      return false
    }

    return this.value.raw === vo.value.raw
  }

  private static isValidRaw(value: string): boolean {
    if (value.length > 512) {
      return false
    }

    return !/[^\x20-\x7E]/.test(value)
  }
}
