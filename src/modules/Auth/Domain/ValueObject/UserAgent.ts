import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'

export interface UserAgentProps {
  raw: string
  browser: {
    name: string | null
    version: string | null
  }
  os: {
    name: string | null
    version: string | null
  }
  device: {
    type: string | null
    vendor: string | null
    model: string | null
  }
}

export class UserAgent extends ValueObject<UserAgentProps> {
  private __userAgentBrand: void

  private constructor(props: UserAgentProps) {
    super(props)
  }

  public static fromProps(props: UserAgentProps): UserAgent {
    const result = this.safeCreate(props)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static safeCreate(props: UserAgentProps): Result<UserAgent, UserSessionDomainException> {
    const normalizedRaw = props.raw.trim()

    if (!normalizedRaw) {
      return success(this.unknown())
    }

    if (!this.isValidRaw(normalizedRaw)) {
      return fail(UserSessionDomainException.invalidUserAgent(normalizedRaw))
    }

    return success(
      new UserAgent({
        ...props,
        raw: normalizedRaw,
      }),
    )
  }

  public static unknown(): UserAgent {
    return new UserAgent({
      raw: 'Unknown',
      browser: { name: null, version: null },
      os: { name: null, version: null },
      device: { type: null, vendor: null, model: null },
    })
  }

  get raw(): string {
    return this.value.raw
  }

  get browser(): UserAgentProps['browser'] {
    return this.value.browser
  }

  get os(): UserAgentProps['os'] {
    return this.value.os
  }

  get device(): UserAgentProps['device'] {
    return this.value.device
  }

  public equals(vo?: UserAgent | null): boolean {
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
