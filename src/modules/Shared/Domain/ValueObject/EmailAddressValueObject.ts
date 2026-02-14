import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'

export abstract class EmailAddressValueObject extends ValueObject<string> {
  private static MAX_LENGTH = 320
  private static LOCAL_MAX_LENGTH = 64
  private static REGEX = /^[^\s@]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

  protected static isValidEmail(value: string): boolean {
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
