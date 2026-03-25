import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { OwnerProfileTaxId } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileTaxId'
import { OwnerProfileCompanyName } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileCompanyName'
import { OwnerProfileContactPhone } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileContactPhone'

export class OwnerProfile {
  public readonly id: Identifier
  public readonly userId: Identifier
  private readonly _companyName: OwnerProfileCompanyName | null
  private readonly _taxId: OwnerProfileTaxId | null
  private readonly _contactPhone: OwnerProfileContactPhone | null
  public readonly createdAt: Date
  private readonly _updatedAt: Date

  constructor(
    id: Identifier,
    userId: Identifier,
    companyName: OwnerProfileCompanyName | null,
    taxId: OwnerProfileTaxId | null,
    contactPhone: OwnerProfileContactPhone | null,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id
    this.userId = userId
    this._companyName = companyName
    this._taxId = taxId
    this._contactPhone = contactPhone
    this.createdAt = createdAt
    this._updatedAt = updatedAt
  }

  get companyName(): OwnerProfileCompanyName | null {
    return this._companyName
  }

  get taxId(): OwnerProfileTaxId | null {
    return this._taxId
  }

  get contactPhone(): OwnerProfileContactPhone | null {
    return this._contactPhone
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  public static create(id: Identifier, userId: Identifier, now: Date): OwnerProfile {
    return new OwnerProfile(id, userId, null, null, null, now, now)
  }
}
