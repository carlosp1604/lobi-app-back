import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { SportsmanProfileBio } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBio'
import { SportsmanProfileBirthDate } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBirthDate'

export class SportsmanProfile {
  public readonly id: Identifier
  public readonly userId: Identifier
  private readonly _birthDate: SportsmanProfileBirthDate | null
  private readonly _bio: SportsmanProfileBio | null
  public readonly createdAt: Date
  private readonly _updatedAt: Date

  constructor(
    id: Identifier,
    userId: Identifier,
    birthDate: SportsmanProfileBirthDate | null,
    bio: SportsmanProfileBio | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id
    this.userId = userId
    this._birthDate = birthDate
    this._bio = bio
    this.createdAt = createdAt
    this._updatedAt = updatedAt
  }

  get birthDate(): SportsmanProfileBirthDate | null {
    return this._birthDate
  }

  get bio(): SportsmanProfileBio | null {
    return this._bio
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  public static create(id: Identifier, userId: Identifier, now: Date): SportsmanProfile {
    return new SportsmanProfile(id, userId, null, null, now, now)
  }
}
