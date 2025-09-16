import { DomainException } from '~/src/modules/Exception/Domain/DomainException'

export class UserUploadDomainException extends DomainException {
  public static invalidUserUploadIdId = 'user_upload_domain_invalid_user_upload_id'

  private constructor(message: string, id: string) {
    super(message, id, UserUploadDomainException.name)
  }

  public static invalidUserUploadId(userUploadId: string) {
    return new UserUploadDomainException(`${userUploadId} is not a valid UserUpload ID`, this.invalidUserUploadIdId)
  }
}
