import { OwnerProfileContactPhone } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileContactPhone'

export class OwnerProfileContactPhoneMother {
  public static readonly INVALID_FORMAT_CASES = [
    '34 666 555 444',
    '+034 666 555 444',
    '+34 123',
    '+12345678901234567890',
    '+34 666 ABC 444',
    '+34 666_555_444',
    '++34666555444',
    '',
  ]

  static validString(): string {
    return '+34 666-555.444'
  }

  static valid(): OwnerProfileContactPhone {
    return OwnerProfileContactPhone.fromString(this.validString())
  }

  static randomString(): string {
    const firstDigit = Math.floor(Math.random() * 9) + 1
    const length = Math.floor(Math.random() * 9) + 6

    let digits = ''
    for (let i = 0; i < length; i++) {
      digits += Math.floor(Math.random() * 10).toString()
    }

    return `+${firstDigit}${digits.slice(0, 3)}${digits.slice(3, 6)}${digits.slice(6)}`
  }

  static random(): OwnerProfileContactPhone {
    return OwnerProfileContactPhone.fromString(this.randomString())
  }

  static invalid(): string {
    return 'invalid-owner-phone'
  }
}
