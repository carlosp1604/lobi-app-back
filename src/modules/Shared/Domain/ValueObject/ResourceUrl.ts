import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export class ResourceUrl extends ValueObject<string> {
  private __resourceUrlBrand: void

  public static readonly MAX_LENGTH = 2048

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): ResourceUrl {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<ResourceUrl, SharedDomainException> {
    const normalized = value.trim()

    if (!this.isValidUrl(normalized)) {
      return fail(SharedDomainException.invalidResourceUrl(value))
    }

    return success(new ResourceUrl(normalized))
  }

  private static isValidUrl(value: string): boolean {
    if (value.length > ResourceUrl.MAX_LENGTH) {
      return false
    }

    try {
      const url = new URL(value)
      return ['http:', 'https:'].includes(url.protocol)
    } catch {
      return false
    }
  }
}
