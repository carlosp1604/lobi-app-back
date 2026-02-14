import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserProfileId } from '~/src/modules/User/Domain/ValueObject/Profile/UserProfileId'
import { SportsmanProfile } from '~/src/modules/User/Domain/Profile/SportsmanProfile'
import { UserProfileIdMother } from '~/src/test/mothers/UserProfileIdMother'
import { SportsmanProfileBio } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBio'
import { SportsmanProfileBirthDate } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBirthDate'

export class SportsmanProfileTestBuilder {
  private _id = UserProfileIdMother.valid()
  private _userId = UserIdMother.valid()
  private _bio: SportsmanProfileBio | null = null
  private _birthDate: SportsmanProfileBirthDate | null = null
  private _createdAt = new Date()
  private _updatedAt = new Date()

  withId(id: UserProfileId) {
    this._id = id
    return this
  }

  withUserId(userId: UserId) {
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
