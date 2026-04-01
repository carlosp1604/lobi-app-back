import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export enum ValidTranslatableField {
  NAME = 'name',
}

export class TranslatableField extends ValueObject<ValidTranslatableField> {
  private __translatableFieldBrand: void

  private constructor(value: ValidTranslatableField) {
    super(value)

    if (!this.isValidField(value)) {
      throw SharedDomainException.invalidTranslatableField()
    }
  }

  static name(): TranslatableField {
    return new TranslatableField(ValidTranslatableField.NAME)
  }

  static fromString(value: string): TranslatableField {
    return new TranslatableField(value as ValidTranslatableField)
  }

  private isValidField(value: string): boolean {
    return Object.values(ValidTranslatableField).includes(value as ValidTranslatableField)
  }
}
