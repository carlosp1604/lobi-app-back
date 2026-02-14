import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { OwnerProfile } from '~/src/modules/User/Domain/Profile/OwnerProfile'
import { UserProfileId } from '~/src/modules/User/Domain/ValueObject/Profile/UserProfileId'
import { OwnerProfileTaxId } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileTaxId'
import { OwnerProfileRawModel } from '~/src/modules/User/Infrastructure/Entities/Profiles/owner-profile.entity'
import { OwnerProfileCompanyName } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileCompanyName'
import { OwnerProfileContactPhone } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileContactPhone'

export class OwnerProfileTranslator {
  public static toDomain(rawModel: OwnerProfileRawModel): OwnerProfile {
    return new OwnerProfile(
      UserProfileId.fromString(rawModel.id),
      UserId.fromString(rawModel.user_id),
      rawModel.company_name ? OwnerProfileCompanyName.fromString(rawModel.company_name) : null,
      rawModel.tax_id ? OwnerProfileTaxId.fromString(rawModel.tax_id) : null,
      rawModel.contact_phone ? OwnerProfileContactPhone.fromString(rawModel.contact_phone) : null,
      rawModel.created_at,
      rawModel.updated_at,
    )
  }

  public static toDatabase(domain: OwnerProfile): OwnerProfileRawModel {
    return {
      id: domain.id.value,
      user_id: domain.userId.value,
      company_name: domain.companyName ? domain.companyName.value : null,
      tax_id: domain.taxId ? domain.taxId.value : null,
      contact_phone: domain.contactPhone ? domain.contactPhone.value : null,
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    }
  }
}
