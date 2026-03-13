import fc from 'fast-check'
import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'
import { OwnerProfileContactPhoneMother } from '~/src/test/mothers/OwnerProfileContactPhoneMother'
import { OwnerProfileContactPhone } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileContactPhone'

describe('OwnerProfileContactPhone', () => {
  const validPhoneArbitrary = fc
    .tuple(fc.constantFrom(...'123456789'), fc.string({ unit: fc.constantFrom(...'0123456789'), minLength: 6, maxLength: 14 }))
    .map(([firstDigit, restDigits]) => {
      return `  +${firstDigit}-${restDigits.slice(0, 3)}.${restDigits.slice(3, 6)} ${restDigits.slice(6)}  `
    })

  describe('fromString', () => {
    it('should not throw error when phone is valid (including mixed visual separators)', () => {
      fc.assert(
        fc.property(validPhoneArbitrary, (phone) => {
          expect(() => OwnerProfileContactPhone.fromString(phone)).not.toThrow()
        }),
      )
    })

    it.each(OwnerProfileContactPhoneMother.INVALID_FORMAT_CASES)(
      'should throw error when phone format is not valid after sanitization: %s',
      (invalidPhone) => {
        expect(() => OwnerProfileContactPhone.fromString(invalidPhone)).toThrow(
          ProfileDomainException.invalidOwnerContactPhone(invalidPhone),
        )
      },
    )
  })

  describe('safeCreate', () => {
    it('should return success when phone is valid string after sanitization', () => {
      fc.assert(
        fc.property(validPhoneArbitrary, (phone) => {
          const result = OwnerProfileContactPhone.safeCreate(phone)

          expect(result.success).toBe(true)
        }),
      )
    })

    it.each(OwnerProfileContactPhoneMother.INVALID_FORMAT_CASES)(
      'should return error when phone is not valid after sanitization: %s',
      (invalidPhone) => {
        const result = OwnerProfileContactPhone.safeCreate(invalidPhone)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(ProfileDomainException.invalidOwnerContactPhone(invalidPhone))
      },
    )
  })

  describe('normalization', () => {
    it('should strip out spaces, hyphens and dots to store a pure E.164 format', () => {
      const rawValue = `   ${OwnerProfileContactPhoneMother.validString()}   `
      const ownerProfileContactPhoneValueObject = OwnerProfileContactPhone.fromString(rawValue)

      expect(ownerProfileContactPhoneValueObject.value).toBe('+34666555444')
    })
  })
})
