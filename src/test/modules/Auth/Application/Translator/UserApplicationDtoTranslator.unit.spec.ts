import { UserNameMother } from '~/src/test/mothers/UserNameMother'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserApplicationDtoTranslator } from '~/src/modules/Auth/Application/Translator/UserApplicationDtoTranslator'

describe('UserApplicationDtoTranslator', () => {
  describe('fromDomain', () => {
    let userTestBuilder: UserTestBuilder

    beforeEach(() => {
      userTestBuilder = new UserTestBuilder()
        .withId(IdentifierMother.valid())
        .withName(UserNameMother.valid())
        .withUsername(UserUsernameMother.valid())
        .withUploadId(null)
    })

    it('should return the correct application dto', () => {
      const user = userTestBuilder.build()

      const result = UserApplicationDtoTranslator.fromDomain(user)

      expect(result.id).toBe(user.id.value)
      expect(result.name).toBe(user.name.value)
      expect(result.username).toBe(user.username.value)
      // TODO: Check imageUrl when is supported
      expect(result.imageUrl).toBeNull()
    })
  })
})
