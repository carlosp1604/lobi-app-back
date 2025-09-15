import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject'
import { UserDomainException } from '~/src/modules/Users/Domain/UserDomainException'

export class UserUploadId extends ValueObject<string> {
  private constructor(value: string) {
    const normalized = value.trim()

    super(normalized)

    if (!this.isValidId(normalized)) {
      throw UserDomainException.invalidUserId(value)
    }
  }

  static fromString(value: string): UserUploadId {
    return new UserUploadId(value)
  }

  private isValidId(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    return uuidRegex.test(value)
  }
}
