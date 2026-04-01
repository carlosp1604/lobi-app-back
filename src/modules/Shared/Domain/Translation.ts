import { Locale } from '~/src/modules/Shared/Domain/ValueObject/Locale'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { TranslatableType } from '~/src/modules/Shared/Domain/ValueObject/TranslatableType'
import { TranslatableField } from '~/src/modules/Shared/Domain/ValueObject/TranslatableField'

export class Translation {
  private constructor(
    public readonly translatableId: Identifier,
    public readonly type: TranslatableType,
    public readonly field: TranslatableField,
    public readonly language: Locale,
    public readonly content: string,
  ) {}

  public static hydrate(
    translatableId: Identifier,
    translatableType: TranslatableType,
    field: TranslatableField,
    language: Locale,
    content: string,
  ): Translation {
    return new Translation(translatableId, translatableType, field, language, content)
  }

  public isFor(field: TranslatableField, language: Locale): boolean {
    return this.field.equals(field) && this.language.equals(language)
  }

  public isField(field: TranslatableField): boolean {
    return this.field.equals(field)
  }
}
