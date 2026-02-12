import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'

export const SECURE_HASH_PATTERN = /^\$2[aby]\$(0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/

export abstract class CredentialHashValueObject extends ValueObject<string> {
  protected isValid(value: string): boolean {
    if (!value) {
      return false
    }

    if (value.length > 255) {
      return false
    }

    if (/\s/.test(value)) {
      return false
    }

    return SECURE_HASH_PATTERN.test(value)
  }
}
