import { UserUploadDomainException } from '~/src/modules/Media/Domain/UserUploadDomainException'
import { UuidValueObject } from '~/src/modules/Shared/Domain/ValueObject/UuidValueObject'

export class UserUploadId extends UuidValueObject {
  private __userUploadIdBrand: void

  private constructor(value: string) {
    const normalized = value.trim()

    super(normalized)

    if (!this.isValidId(normalized)) {
      throw UserUploadDomainException.invalidUserUploadId(value)
    }
  }

  static fromString(value: string): UserUploadId {
    return new UserUploadId(value)
  }
}
