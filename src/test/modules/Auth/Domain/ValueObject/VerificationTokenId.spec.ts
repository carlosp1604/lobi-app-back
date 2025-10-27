import fc from 'fast-check'
import { VerificationTokenId } from '~/src/modules/Auth/Domain/ValueObject/VerificationTokenId'
import { VerificationTokenDomainException } from '~/src/modules/Auth/Domain/VerificationTokenDomainException'
import { VerificationTokenIdMother } from '~/src/test/mothers/VerificationTokenIdMother'

const invalidCases: Array<string> = [
  '',
  '123',
  'zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz',
  '12345678-1234-1234-1234-1234567890',
  '123456781234123412341234567890ab',
  '12345678-1234-1234-1234-1234567890ab-',
  '-12345678-1234-1234-1234-1234567890ab',
  '12345678-1234-1234-1234-1234567890abc',
  '12345678_1234_1234_1234_1234567890ab',
  '12345678-1234-1234-1234-1234567890a',
  'g2345678-1234-1234-1234-1234567890ab',
]

describe('VerificationTokenId', () => {
  it('should not throw error when VerificationToken ID is valid', () => {
    fc.assert(
      fc.property(fc.uuid(), (verificationTokenId) => {
        expect(() => VerificationTokenId.fromString(verificationTokenId)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when VerificationToken ID is not valid: %s', (verificationTokenId) => {
    expect(() => VerificationTokenId.fromString(verificationTokenId)).toThrow(
      VerificationTokenDomainException.invalidVerificationTokenId(verificationTokenId),
    )
  })

  it('should store the correct value', () => {
    const validValue = VerificationTokenIdMother.valid().toString()
    const verificationTokenIdValueObject = VerificationTokenId.fromString(validValue)

    expect(verificationTokenIdValueObject.value).toEqual(validValue)
  })
})
