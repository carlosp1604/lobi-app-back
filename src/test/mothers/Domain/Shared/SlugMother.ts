import { Slug } from '~/src/modules/Shared/Domain/ValueObject/Slug'

export class SlugMother {
  static valid(): Slug {
    return Slug.fromString('a-valid-slug')
  }

  static random(): Slug {
    return Slug.fromString(SlugMother.randomString())
  }

  public static randomString(): string {
    const length = 16
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = 'a'

    for (let i = 1; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    return result
  }
}
