import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'

export abstract class EmailAddressValueObject extends ValueObject<string> {
  protected isValidEmail(value: string): boolean {
    if (!value) {
      return false
    }

    if (value.length > 320) {
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

    if (local.length > 64) {
      return false
    }

    return /^[^\s@]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)
  }
}
