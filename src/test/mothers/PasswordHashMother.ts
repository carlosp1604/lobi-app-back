import { PasswordHash } from '~/src/modules/Auth/Domain/ValueObject/PasswordHash'

export class PasswordHashMother {
  static valid(): PasswordHash {
    return PasswordHash.fromString('$2b$10$CwTycUXWue0Thq9StjUM0uJ8FhVG0aUoUsvhj5kLVJk0r8O.3/0Fe')
  }
}
