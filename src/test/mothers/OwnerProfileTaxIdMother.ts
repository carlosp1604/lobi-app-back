import { OwnerProfileTaxId } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileTaxId'

export class OwnerProfileTaxIdMother {
  public static readonly INVALID_FORMAT_CASES = [
    'A'.repeat(OwnerProfileTaxId.MAX_LENGTH + 1),
    'A'.repeat(OwnerProfileTaxId.MIN_LENGTH - 1),
    ' 123456789 '.repeat(6),
    '1234',
    '   ',
    '',
    '12345@678!',
    'ES-B123*456',
  ]

  static valid(): OwnerProfileTaxId {
    return OwnerProfileTaxId.fromString(OwnerProfileTaxIdMother.validString())
  }

  static validString(): string {
    return 'b-12.34.56_78/z'
  }

  static randomString(): string {
    const alphaNumChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const visualSeparators = ' -._/'

    const coreLength = Math.floor(Math.random() * 21) + 10

    let result = ''

    for (let i = 0; i < coreLength; i++) {
      result += alphaNumChars.charAt(Math.floor(Math.random() * alphaNumChars.length))

      if (Math.random() < 0.3) {
        result += visualSeparators.charAt(Math.floor(Math.random() * visualSeparators.length))
      }
    }

    if (Math.random() < 0.5) {
      result = '   ' + result + ' \n '
    }

    return result
  }

  static random(): OwnerProfileTaxId {
    return OwnerProfileTaxId.fromString(this.randomString())
  }

  static invalid(): string {
    const cases = this.INVALID_FORMAT_CASES
    return cases[Math.floor(Math.random() * cases.length)]
  }
}
