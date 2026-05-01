import { Slug } from '~/src/modules/Shared/Domain/ValueObject/Slug'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { SlugMother } from '~/src/test/mothers/Domain/Shared/SlugMother'
import { ResourceUrl } from '~/src/modules/Shared/Domain/ValueObject/ResourceUrl'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { SportParticipantsDefinitionMother } from '~/src/test/mothers/Domain/Activity/Sport/SportParticipantsDefinitionMother'
import { AvailableCapability, Sport, SportSpecsDefinition } from '~/src/modules/Activity/Domain/Sport/Sport'

export class SportTestBuilder {
  private _id = IdentifierMother.valid()
  private _slug = SlugMother.random()
  private _imageUrl: ResourceUrl | null = null
  private _specs: SportSpecsDefinition = { participants: SportParticipantsDefinitionMother.random() }
  private _capabilities: Array<AvailableCapability> = ['location']
  private _createdAt = new Date()
  private _updatedAt = new Date()

  withId(userId: Identifier) {
    this._id = userId
    return this
  }

  withSLug(slug: Slug) {
    this._slug = slug
    return this
  }

  withImageUrl(imageUrl: ResourceUrl | null) {
    this._imageUrl = imageUrl
    return this
  }

  withSpecs(specs: SportSpecsDefinition) {
    this._specs = specs
    return this
  }

  withCapabilities(capabilities: Array<AvailableCapability>) {
    this._capabilities = capabilities
    return this
  }

  withCreatedAt(date: Date) {
    this._createdAt = date
    return this
  }

  withUpdatedAt(date: Date) {
    this._updatedAt = date
    return this
  }

  build(): Sport {
    return Sport.reconstitute({
      id: this._id,
      slug: this._slug,
      imageUrl: this._imageUrl,
      config: { specs: this._specs, capabilities: this._capabilities },
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    })
  }
}
