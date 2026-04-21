import { Locale, SupportedLocales } from '~/src/modules/Shared/Domain/ValueObject/Locale'

export class LocaleMother {
  static readonly INVALID_FORMAT_CASES = ['', 'es-ES', 'en_US', 'spanish', '12', 'ru']

  static default(): string {
    return Locale.DEFAULT
  }

  static randomString(): string {
    const randomIndex = Math.floor(Math.random() * SupportedLocales.length)
    return SupportedLocales[randomIndex]
  }

  static random(): Locale {
    return Locale.fromString(this.randomString())
  }
}
