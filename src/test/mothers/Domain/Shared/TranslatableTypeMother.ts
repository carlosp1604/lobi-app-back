import { TranslatableType, ValidTranslatableType } from '~/src/modules/Shared/Domain/ValueObject/TranslatableType'

export class TranslatableTypeMother {
  public static readonly INVALID_FORMAT_CASES = ['user', 'order', 'invalid-type', '']
  public static readonly VALID_TRANSLATABLE_TYPES: Array<ValidTranslatableType> = Object.values(ValidTranslatableType)

  static randomString(): string {
    const values = Object.values(ValidTranslatableType)
    return values[Math.floor(Math.random() * values.length)]
  }

  static sport(): TranslatableType {
    return TranslatableType.sport()
  }
}
