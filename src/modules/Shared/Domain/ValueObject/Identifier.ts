import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export class Identifier extends ValueObject<string> {
  private __identifierBrand: void

  private static readonly REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  private constructor(value: string) {
    super(value)
  }

  static safeCreate(value: string): Result<Identifier, SharedDomainException> {
    const normalized = value.trim()

    if (!this.isValidIdentifier(normalized)) {
      return fail(SharedDomainException.invalidIdentifier(value))
    }

    return success(new Identifier(normalized))
  }

  static create(value: string): Identifier {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  private static isValidIdentifier(value: string): boolean {
    return Identifier.REGEX.test(value)
  }

  public toPrimitives(): string {
    return this._value
  }
}
