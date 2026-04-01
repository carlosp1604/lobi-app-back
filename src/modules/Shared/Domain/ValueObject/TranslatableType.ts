import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

export enum ValidTranslatableType {
  SPORT = 'sport',
}

export class TranslatableType extends ValueObject<ValidTranslatableType> {
  private __translatableTypeBrand: void

  private constructor(value: ValidTranslatableType) {
    super(value)

    if (!this.isValidType(value)) {
      throw SharedDomainException.invalidTranslatableType()
    }
  }

  static sport(): TranslatableType {
    return new TranslatableType(ValidTranslatableType.SPORT)
  }

  static fromString(value: string): TranslatableType {
    return new TranslatableType(value as ValidTranslatableType)
  }

  private isValidType(value: string): boolean {
    return Object.values(ValidTranslatableType).includes(value as ValidTranslatableType)
  }
}
