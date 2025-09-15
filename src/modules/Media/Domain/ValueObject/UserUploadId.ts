import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject'
import { UserDomainException } from '~/src/modules/Auth/Domain/UserDomainException'

export class UserUploadId extends ValueObject<string> {
  private constructor(value: string) {
    super(value)

    if (!this.isValidId(value)) {
      throw UserDomainException.invalidUserId(value)
    }
  }

  static fromString(value: string): UserUploadId {
    return new UserUploadId(value)
  }

  private isValidId(value: string): boolean {
    return /^[0-9a-fA-F-]{36}$/.test(value)
  }
}
