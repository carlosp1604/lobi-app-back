import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export class UuidValueObject extends ValueObject<string> {
  protected isValidId(value: string): boolean {
    return UUID_REGEX.test(value)
  }
}
