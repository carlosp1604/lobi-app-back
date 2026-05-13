import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'

export class IdentifierMother {
  public static readonly INVALID_FORMAT_CASES = [
    '',
    '123',
    'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz',
    '12345678-1234-1234-1234-1234567890',
    '123456781234123412341234567890ab',
    '12345678-1234-1234-1234-1234567890ab-',
    '-12345678-1234-1234-1234-1234567890ab',
    '12345678-1234-1234-1234-1234567890abc',
    '12345678_1234_1234_1234_1234567890ab',
    '12345678-1234-1234-1234-1234567890a',
    'g2345678-1234-1234-1234-1234567890ab',
  ]

  static valid(): Identifier {
    return Identifier.create(this.validString())
  }

  static validString() {
    return crypto.randomUUID()
  }

  static invalid() {
    return 'invalid-identifier'
  }
}
