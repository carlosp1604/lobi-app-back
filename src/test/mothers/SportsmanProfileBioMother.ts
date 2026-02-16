import { SportsmanProfileBio } from '~/src/modules/User/Domain/ValueObject/Profile/SportsmanProfileBio'

export class SportsmanProfileBioMother {
  public static readonly INVALID_FORMAT_CASES = ['a'.repeat(SportsmanProfileBio.MAX_LENGTH + 1), ' '.repeat(10), '']

  static valid(): SportsmanProfileBio {
    return SportsmanProfileBio.fromString('Just a brief sportsman bio for testing ⚽')
  }

  static randomString(): string {
    // eslint-disable-next-line quotes
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 . , &'-\n\t🎾🥎⚽🏀🏈⚾🏐🎱"

    const min = SportsmanProfileBio.MIN_LENGTH
    const max = SportsmanProfileBio.MAX_LENGTH
    const length = Math.floor(Math.random() * (max - min + 1)) + min

    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    result = 'a' + result.slice(1)

    return result
  }

  static random(): SportsmanProfileBio {
    return SportsmanProfileBio.fromString(this.randomString())
  }

  static invalid(): string {
    return 'a'.repeat(SportsmanProfileBio.MAX_LENGTH + 1)
  }
}
