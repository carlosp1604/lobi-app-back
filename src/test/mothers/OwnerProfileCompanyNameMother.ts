import { OwnerProfileCompanyName } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileCompanyName'

export class OwnerProfileCompanyNameMother {
  public static readonly INVALID_FORMAT_CASES = ['A'.repeat(OwnerProfileCompanyName.MAX_LENGTH + 1), '    ', '', '🚀🚀🚀 @!!!\n']

  static validString(): string {
    // eslint-disable-next-line quotes
    return "Lobi & Co., Ltd. - Murcia's Branch 2"
  }

  static valid(): OwnerProfileCompanyName {
    return OwnerProfileCompanyName.fromString(this.validString())
  }

  static randomString(): string {
    // eslint-disable-next-line quotes
    const validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,&'-"
    const min = OwnerProfileCompanyName.MIN_LENGTH
    const max = OwnerProfileCompanyName.MAX_LENGTH
    const length = Math.floor(Math.random() * (max - min + 1)) + min

    let result = ''
    for (let i = 0; i < length; i++) {
      result += validChars.charAt(Math.floor(Math.random() * validChars.length))
    }

    return result
  }

  static random(): OwnerProfileCompanyName {
    return OwnerProfileCompanyName.fromString(this.randomString())
  }

  static invalid(): string {
    const cases = this.INVALID_FORMAT_CASES
    return cases[Math.floor(Math.random() * cases.length)]
  }
}
