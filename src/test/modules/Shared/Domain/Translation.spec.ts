import { LocaleMother } from '~/src/test/mothers/Domain/Shared/LocaleMother'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { TranslatableField } from '~/src/modules/Shared/Domain/ValueObject/TranslatableField'
import { TranslatableTypeMother } from '~/src/test/mothers/Domain/Shared/TranslatableTypeMother'
import { TranslationTestBuilder } from '~/src/test/modules/Shared/Domain/TranslationTestBuilder'

describe('Translation', () => {
  const translatableId = IdentifierMother.valid()
  const translatableType = TranslatableTypeMother.sport()
  const translatableField = TranslatableField.name()
  const language = LocaleMother.random()
  const content = 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.'

  const buildTestBuilder = () => {
    return new TranslationTestBuilder()
      .withTranslatableId(translatableId)
      .withTranslatableType(translatableType)
      .withField(translatableField)
      .withLanguage(language)
      .withContent(content)
  }

  describe.skip('isFor', () => {})

  describe.skip('isField', () => {})

  describe('hydrate', () => {
    it('should store all values correctly', () => {
      const translation = buildTestBuilder().build()

      expect(translation.translatableId.equals(translatableId)).toBe(true)
      expect(translation.type.equals(translatableType)).toBe(true)
      expect(translation.field.equals(translatableField)).toBe(true)
      expect(translation.language.equals(language)).toBe(true)
      expect(translation.content).toBe(content)
    })
  })
})
