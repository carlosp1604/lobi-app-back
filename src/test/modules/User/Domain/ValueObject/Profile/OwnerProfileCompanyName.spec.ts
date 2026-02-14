import fc from 'fast-check'
import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'
import { OwnerProfileCompanyName } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileCompanyName'
import { OwnerProfileCompanyNameMother } from '~/src/test/mothers/OwnerProfileCompanyNameMother'

describe('OwnerProfileCompanyName', () => {
  const validCompanyNameArbitrary = fc.string({ maxLength: 200 }).filter((s) => {
    const cleaned = s.replace(OwnerProfileCompanyName.INVALID_CHARS_REGEX, '').trim()
    return cleaned.length >= OwnerProfileCompanyName.MIN_LENGTH && cleaned.length <= OwnerProfileCompanyName.MAX_LENGTH
  })

  describe('fromString', () => {
    it('should not throw error when company name is valid after sanitization', () => {
      fc.assert(
        fc.property(validCompanyNameArbitrary, (companyName) => {
          expect(() => OwnerProfileCompanyName.fromString(companyName)).not.toThrow()
        }),
      )
    })

    it.each(OwnerProfileCompanyNameMother.INVALID_FORMAT_CASES)(
      'should throw error when company name is not valid after sanitization: %s',
      (invalidName) => {
        expect(() => OwnerProfileCompanyName.fromString(invalidName)).toThrow(
          ProfileDomainException.invalidOwnerCompanyName(invalidName),
        )
      },
    )
  })

  describe('safeCreate', () => {
    it('should return success when company name is valid after sanitization', () => {
      fc.assert(
        fc.property(validCompanyNameArbitrary, (companyName) => {
          const result = OwnerProfileCompanyName.safeCreate(companyName)

          expect(result.success).toBe(true)
        }),
      )
    })

    it.each(OwnerProfileCompanyNameMother.INVALID_FORMAT_CASES)(
      'should return error when company name is not valid after sanitization: %s',
      (invalidName) => {
        const result = OwnerProfileCompanyName.safeCreate(invalidName)

        expect(result.success).toBe(false)
        expect(result['error']).toEqual(ProfileDomainException.invalidOwnerCompanyName(invalidName))
      },
    )
  })

  it('should strip out emojis, newlines, disallowed symbols and trim the string', () => {
    const rawValue = ` \n [ 🚀 ${OwnerProfileCompanyNameMother.validString()} @!!! \n ]{´¨}~€`
    const ownerProfileCompanyNameValueObject = OwnerProfileCompanyName.fromString(rawValue)

    expect(ownerProfileCompanyNameValueObject.value).toBe(OwnerProfileCompanyNameMother.validString())
  })
})
