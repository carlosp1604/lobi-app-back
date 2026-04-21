export class SlugMother {
  static readonly INVALID_FORMAT_CASES = [
    '',
    'a',
    'slug with spaces',
    'slug--double-dash',
    '-slug-starts-with-dash',
    'slug--ends-with-dash-',
    'slug_with_underscore',
    'slug-with-special-characters!$',
    'a'.repeat(129),
  ]

  static randomString(): string {
    return SlugMother.randomStringWithLength(36)
  }

  static randomStringWithLength(length: number): string {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = 'a'

    for (let i = 1; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    return result
  }
}
