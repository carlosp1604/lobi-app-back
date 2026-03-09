import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { OwnerProfile } from '~/src/modules/User/Domain/Profile/OwnerProfile'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { OwnerProfileTaxId } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileTaxId'
import { OwnerProfileCompanyName } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileCompanyName'
import { OwnerProfileContactPhone } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileContactPhone'

export class OwnerProfileTestBuilder {
  private _id = IdentifierMother.valid()
  private _userId = IdentifierMother.valid()
  private _companyName: OwnerProfileCompanyName | null = null
  private _taxId: OwnerProfileTaxId | null = null
  private _contactPhone: OwnerProfileContactPhone | null = null
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
