import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export class EmailAddress extends ValueObject<string> {
  private __emailAddressBrand: void

  private static MAX_LENGTH = 320
  private static LOCAL_MAX_LENGTH = 64
  private static REGEX = /^[^\s@]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): EmailAddress {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<EmailAddress, SharedDomainException> {
    const normalized = value.trim()

    if (!EmailAddress.isValidEmail(normalized)) {
      return fail(SharedDomainException.invalidEmailAddress(value))
    }

    return success(new EmailAddress(normalized))
  }

  private static isValidEmail(value: string): boolean {
    if (!value) {
      return false
    }

    if (value.length > this.MAX_LENGTH) {
      return false
    }

    const parts = value.split('@')

    if (parts.length !== 2) {
      return false
    }

    const [local, domain] = parts
    if (!local || !domain) {
      return false
    }

    if (local.length > this.LOCAL_MAX_LENGTH) {
      return false
    }

    return this.REGEX.test(value)
  }
}
