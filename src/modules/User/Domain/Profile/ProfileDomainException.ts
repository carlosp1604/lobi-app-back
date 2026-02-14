import { DomainException } from '~/src/modules/Exception/Domain/DomainException'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'

export class ProfileDomainException extends DomainException {
  public static invalidUserProfileIdId = 'user_profile_domain_invalid_user_profile_id'
  public static invalidSportsmanBioId = 'user_profile_domain_invalid_sportsman_bio'
  public static invalidSportsmanBirthDateId = 'user_profile_domain_invalid_sportsman_birth_date'
  public static sportsmanBirthDateInFutureId = 'user_profile_domain_sportsman_birth_date_in_future'
  public static sportsmanBirthDateTooOldId = 'user_profile_domain_sportsman_birth_date_too_old'
  public static invalidOwnerTaxIdId = 'user_profile_owner_invalid_tax_id'
  public static invalidOwnerCompanyNameId = 'user_profile_owner_invalid_company_name'
  public static invalidOwnerContactPhoneId = 'user_profile_owner_invalid_contact_phone'

  private constructor(message: string, id: string) {
    super(message, id, ProfileDomainException.name)
  }

  public static invalidUserProfileId(profileId: string) {
    const safeProfileIdSample = StringFormatter.formatSafe(profileId, 60)
    return new ProfileDomainException(`${safeProfileIdSample} is not a valid User Profile ID`, this.invalidUserProfileIdId)
  }

  public static invalidSportsmanBio(bio: string) {
    const safeBioSample = StringFormatter.formatSafe(bio, 128)
    return new ProfileDomainException(`${safeBioSample} is not a valid bio`, this.invalidSportsmanBioId)
  }

  public static invalidSportsmanBirthDate(birthDate: Date) {
    return new ProfileDomainException(`${birthDate.toLocaleString()} is not a valid birth date`, this.invalidSportsmanBirthDateId)
  }

  public static sportsmanBirthDateInFuture() {
    // eslint-disable-next-line quotes
    return new ProfileDomainException("Sportsman's birth date cannot be greater than current time", this.sportsmanBirthDateInFutureId)
  }

  public static sportsmanBirthDateTooOld(maxAge: number) {
    return new ProfileDomainException(`Sportsman's age cannot be greater than ${maxAge} years`, this.sportsmanBirthDateTooOldId)
  }

  public static invalidOwnerTaxId(taxId: string) {
    const safeTaxIdSample = StringFormatter.formatSafe(taxId, 60)
    return new ProfileDomainException(`${safeTaxIdSample} is not a valid tax ID`, this.invalidOwnerTaxIdId)
  }

  public static invalidOwnerCompanyName(companyName: string) {
    const safeCompanyNameSample = StringFormatter.formatSafe(companyName, 128)
    return new ProfileDomainException(`${safeCompanyNameSample} is not a valid company name`, this.invalidOwnerCompanyNameId)
  }

  public static invalidOwnerContactPhone(contactPhone: string) {
    const safeContactPhoneSample = StringFormatter.formatSafe(contactPhone, 128)
    return new ProfileDomainException(`${safeContactPhoneSample} is not a valid contact phone`, this.invalidOwnerContactPhoneId)
  }
}
