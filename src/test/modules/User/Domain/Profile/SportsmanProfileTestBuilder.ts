import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { SportsmanProfile } from '~/src/modules/User/Domain/Profile/SportsmanProfile'
import { SportsmanProfileBio } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBio'
import { SportsmanProfileBirthDate } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBirthDate'

export class SportsmanProfileTestBuilder {
  private _id = IdentifierMother.valid()
  private _userId = IdentifierMother.valid()
  private _bio: SportsmanProfileBio | null = null
  private _birthDate: SportsmanProfileBirthDate | null = null
  private _createdAt = new Date()
  private _updatedAt = new Date()

  withId(id: Identifier) {
    this._id = id
    return this
  }

  withUserId(userId: Identifier) {
    this._userId = userId
    return this
  }

  withBio(bio: SportsmanProfileBio | null) {
    this._bio = bio
    return this
  }

  withBirthDate(birthDate: SportsmanProfileBirthDate | null) {
    this._birthDate = birthDate
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

  build(): SportsmanProfile {
    return new SportsmanProfile(this._id, this._userId, this._birthDate, this._bio, this._createdAt, this._updatedAt)
  }
}
