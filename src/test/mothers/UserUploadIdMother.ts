import { UserUploadId } from '~/src/modules/Media/Domain/ValueObject/UserUploadId'

export class UserUploadIdMother {
  static valid(): UserUploadId {
    return UserUploadId.fromString(crypto.randomUUID())
  }
}
