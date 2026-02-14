export abstract class UuidMother {
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

  protected static validUuidString() {
    return crypto.randomUUID()
  }

  protected static invalidString() {
    const cases = this.INVALID_FORMAT_CASES
    return cases[Math.floor(Math.random() * cases.length)]
  }
}
