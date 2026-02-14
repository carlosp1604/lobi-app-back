import fc from 'fast-check'
import { OwnerProfileTaxIdMother } from '~/src/test/mothers/OwnerProfileTaxIdMother'
import { ProfileDomainException } from '~/src/modules/User/Domain/Profile/ProfileDomainException'
import { OwnerProfileTaxId } from '~/src/modules/User/Domain/ValueObject/Profile/OwnerProfileTaxId'

describe('OwnerProfileTaxId', () => {
  const validTaxIdArbitrary = fc
    .string({
      unit: fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', ' ', '-', '.', '_', '/'),
      maxLength: 100,
    })
    .filter((s) => {
      const stripped = s.replace(new RegExp('[\\s._/-]', 'g'), '')
      return stripped.length >= OwnerProfileTaxId.MIN_LENGTH && stripped.length <= OwnerProfileTaxId.MAX_LENGTH
    })

  describe('fromString', () => {
    it('should not throw error when tax ID is valid', () => {
      fc.assert(
        fc.property(validTaxIdArbitrary, (taxId) => {
          expect(() => OwnerProfileTaxId.fromString(taxId)).not.toThrow()
        }),
      )
    })

    it.each(OwnerProfileTaxIdMother.INVALID_FORMAT_CASES)('should throw error when tax ID is not valid: %s', (taxId) => {
      expect(() => OwnerProfileTaxId.fromString(taxId)).toThrow(ProfileDomainException.invalidOwnerTaxId(taxId))
    })
  })

  describe('safeCreate', () => {
    it('should return success when tax ID is valid', () => {
      fc.assert(
        fc.property(validTaxIdArbitrary, (taxId) => {
          const result = OwnerProfileTaxId.safeCreate(taxId)

          expect(result.success).toBe(true)
        }),
      )
    })

    it.each(OwnerProfileTaxIdMother.INVALID_FORMAT_CASES)('should return error when tax ID is not valid: %s', (taxId) => {
      const result = OwnerProfileTaxId.safeCreate(taxId)

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(ProfileDomainException.invalidOwnerTaxId(taxId))
    })
  })

  it('should store the value converted to uppercase, stripping spaces, hyphens, dots, underscores and slashes', () => {
    const rawValue = `  ${OwnerProfileTaxIdMother.validString()} \n `.toLowerCase()
    const ownerProfileTaxIdValueObject = OwnerProfileTaxId.fromString(rawValue)

    expect(ownerProfileTaxIdValueObject.value).toBe('B12345678Z')
  })
})
