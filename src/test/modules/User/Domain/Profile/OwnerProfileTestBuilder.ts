import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { OwnerProfile } from '~/src/modules/User/Domain/Profile/OwnerProfile'
import { UserProfileId } from '~/src/modules/User/Domain/ValueObject/Profile/UserProfileId'
import { OwnerProfileTaxId } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileTaxId'
import { UserProfileIdMother } from '~/src/test/mothers/UserProfileIdMother'
import { OwnerProfileCompanyName } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileCompanyName'
import { OwnerProfileContactPhone } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileContactPhone'

export class OwnerProfileTestBuilder {
  private _id = UserProfileIdMother.valid()
  private _userId = UserIdMother.valid()
  private _companyName: OwnerProfileCompanyName | null = null
  private _taxId: OwnerProfileTaxId | null = null
  private _contactPhone: OwnerProfileContactPhone | null = null
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

  withCompanyName(companyName: OwnerProfileCompanyName | null) {
    this._companyName = companyName
    return this
  }

  withTaxId(taxId: OwnerProfileTaxId | null) {
    this._taxId = taxId
    return this
  }

  withContactPhone(contactPhone: OwnerProfileContactPhone | null) {
    this._contactPhone = contactPhone
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

  build(): OwnerProfile {
    return new OwnerProfile(
      this._id,
      this._userId,
      this._companyName,
      this._taxId,
      this._contactPhone,
      this._createdAt,
      this._updatedAt,
    )
  }
}
