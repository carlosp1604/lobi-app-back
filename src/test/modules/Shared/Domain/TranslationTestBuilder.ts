import { Translation } from '~/src/modules/Shared/Domain/Translation'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { Locale } from '~/src/modules/Shared/Domain/ValueObject/Locale'
import { TranslatableField } from '~/src/modules/Shared/Domain/ValueObject/TranslatableField'
import { TranslatableType } from '~/src/modules/Shared/Domain/ValueObject/TranslatableType'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { LocaleMother } from '~/src/test/mothers/Domain/Shared/LocaleMother'

export class TranslationTestBuilder {
  private _translatableId: Identifier = IdentifierMother.valid()
  private _translatableType: TranslatableType = TranslatableType.sport()
  private _field: TranslatableField = TranslatableField.name()
  private _language: Locale = LocaleMother.random()
  private _content: string = ''

  withTranslatableId(id: Identifier): this {
    this._translatableId = id
    return this
  }

  withTranslatableType(type: TranslatableType): this {
    this._translatableType = type
    return this
  }

  withField(field: TranslatableField): this {
    this._field = field
    return this
  }

  withLanguage(language: Locale): this {
    this._language = language
    return this
  }

  withContent(content: string): this {
    this._content = content
    return this
  }

  asEnglishName(content: string = 'English Name'): this {
    this._field = TranslatableField.name()
    this._language = Locale.fromString('en')
    this._content = content
    return this
  }

  build(): Translation {
    return Translation.hydrate(this._translatableId, this._translatableType, this._field, this._language, this._content)
  }
}
