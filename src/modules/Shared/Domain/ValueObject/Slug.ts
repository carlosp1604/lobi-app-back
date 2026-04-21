import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export class Slug extends ValueObject<string> {
  private __slugBrand: void

  public static readonly MIN_LENGTH = 2
  public static readonly MAX_LENGTH = 128

  private static readonly STRUCTURE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): Slug {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<Slug, SharedDomainException> {
    const normalized = value.trim().toLowerCase()

    if (!this.isValidSlug(normalized)) {
      return fail(SharedDomainException.invalidSlug(value))
    }

    return success(new Slug(normalized))
  }

  private static isValidSlug(value: string): boolean {
    const hasCorrectLength = value.length >= Slug.MIN_LENGTH && value.length <= Slug.MAX_LENGTH

    return hasCorrectLength && Slug.STRUCTURE_REGEX.test(value)
  }
}
