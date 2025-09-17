import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject'

const HASH_REGEX = /^[A-Za-z0-9+/]{43}=$/

export abstract class HashValueObject extends ValueObject<string> {
  protected isValidHash(value: string): boolean {
    return HASH_REGEX.test(value)
  }
}
