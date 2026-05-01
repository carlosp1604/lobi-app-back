import { SlugMother } from '~/src/test/mothers/Domain/Shared/SlugMother'
import { SportRawModel } from '~/src/modules/Activity/Infrastructure/Entities/sport.entity'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { SportParticipantsDefinitionMother } from '~/src/test/mothers/Domain/Activity/Sport/SportParticipantsDefinitionMother'

export const makeRawSport = (overrides: Partial<SportRawModel> = {}): SportRawModel => {
  return {
    id: overrides.id ?? IdentifierMother.validString(),
    slug: overrides.slug ?? SlugMother.randomString(),
    config: overrides.config ?? {
      capabilities: [],
      specs: { participants: SportParticipantsDefinitionMother.valid() },
    },
    image_url: overrides.image_url ?? null,
    created_at: overrides.created_at ?? new Date(),
    updated_at: overrides.updated_at ?? new Date(),
  }
}
