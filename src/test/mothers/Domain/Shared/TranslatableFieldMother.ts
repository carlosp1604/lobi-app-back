import { TranslatableField, ValidTranslatableField } from '~/src/modules/Shared/Domain/ValueObject/TranslatableField'

export class TranslatableFieldMother {
  public static readonly INVALID_FORMAT_CASES = ['id', 'created_at', 'price', '']
  public static readonly VALID_TRANSLATABLE_FIELDS: Array<ValidTranslatableField> = Object.values(ValidTranslatableField)

  static randomString(): string {
    const values = Object.values(ValidTranslatableField)
    return values[Math.floor(Math.random() * values.length)]
  }

  static name(): TranslatableField {
    return TranslatableField.name()
  }
}
