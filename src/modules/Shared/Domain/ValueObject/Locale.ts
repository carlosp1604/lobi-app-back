import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, fail, success } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export const SUPPORTED_LOCALES = ['es'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export class Locale extends ValueObject<string> {
  private __localeBrand: void

  public static readonly DEFAULT: SupportedLocale = 'es'

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): Locale {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<Locale, SharedDomainException> {
    const normalized = value.trim().toLowerCase()

    if (!SUPPORTED_LOCALES.includes(normalized as SupportedLocale)) {
      return fail(SharedDomainException.invalidLocale())
    }

    return success(new Locale(normalized))
  }
}
