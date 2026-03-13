import fc from 'fast-check'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { EmailAddressMother } from '~/src/test/mothers/Shared/EmailAddressMother'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'

describe('EmailAddress', () => {
  describe('fromString', () => {
    it('should not throw error when email address is valid', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (validEmailAddress) => {
          expect(() => EmailAddress.fromString(validEmailAddress)).not.toThrow()
        }),
      )
    })

    it.each(EmailAddressMother.INVALID_FORMAT_CASES)(
      'should throw error when email address is not valid: %s',
      (invalidEmailAddress) => {
        expect(() => EmailAddress.fromString(invalidEmailAddress)).toThrow(
          SharedDomainException.invalidEmailAddress(invalidEmailAddress),
        )
      },
    )
  })

  describe('safeCreate', () => {
    it('should return success when email address is valid', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (validEmailAddress) => {
          const result = EmailAddress.safeCreate(validEmailAddress)

          expect(result.success).toBe(true)
        }),
      )
    })

    it.each(EmailAddressMother.INVALID_FORMAT_CASES)(
      'should return error when email address is not valid: %s',
      (invalidEmailAddress) => {
        const result = EmailAddress.safeCreate(invalidEmailAddress)

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(SharedDomainException.invalidEmailAddress(invalidEmailAddress))
      },
    )
  })

  it('should store the correct value (normalized)', () => {
    const validValue = EmailAddressMother.randomString()
    const emailAddressValueObject = EmailAddress.fromString(validValue)

    expect(emailAddressValueObject.value).toBe(validValue)
  })
})
