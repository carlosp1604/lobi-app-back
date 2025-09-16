import fc from 'fast-check'
import { UserUploadId } from '~/src/modules/Media/Domain/ValueObject/UserUploadId'
import { UserUploadDomainException } from '~/src/modules/Media/Domain/UserUploadDomainException'

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

describe('UserUploadId', () => {
  it('should not throw error when userUploadId is valid', () => {
    fc.assert(
      fc.property(fc.uuid(), (userUploadId) => {
        expect(() => UserUploadId.fromString(userUploadId)).not.toThrow()
      }),
    )
  })

  it.each(invalidCases)('should throw error when userUploadId is not valid: %s', (userUploadId) => {
    expect(() => UserUploadId.fromString(userUploadId)).toThrow(UserUploadDomainException.invalidUserUploadId(userUploadId))
  })

  it('should store the correct value', () => {
    const userUploadIdValueObject = UserUploadId.fromString('46ec1569-1d5c-40e4-b923-ffb18c1f1add')

    expect(userUploadIdValueObject.value).toEqual('46ec1569-1d5c-40e4-b923-ffb18c1f1add')
  })
})
