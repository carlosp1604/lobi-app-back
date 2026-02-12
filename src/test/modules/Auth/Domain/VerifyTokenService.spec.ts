import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { mock, mockReset } from 'jest-mock-extended'
import { VerificationTokenTestBuilder } from '~/src/test/modules/Auth/Domain/VerificationTokenTestBuilder'
import { VerifyTokenService } from '~/src/modules/Auth/Domain/VerifyTokenService'

describe('VerifyTokenService', () => {
  const mockedHasher = mock<HasherServiceInterface>()
  const verificationToken = new VerificationTokenTestBuilder().build()

  beforeEach(() => {
    mockReset(mockedHasher)
  })

  it('should return TRUE when hasher confirms the match', async () => {
    const candidateValue = '123456'

    mockedHasher.compare.mockResolvedValue(true)

    const service = new VerifyTokenService(mockedHasher)
    const result = await service.verify(verificationToken, candidateValue)

    // ASSERT
    expect(result).toBe(true)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockedHasher.compare).toHaveBeenCalledWith(candidateValue, verificationToken.tokenHash.value)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockedHasher.compare).toHaveBeenCalledTimes(1)
  })

  it('should return FALSE when hasher denies the match', async () => {
    const candidateValue = 'wrong_code'

    mockedHasher.compare.mockResolvedValue(false)

    const service = new VerifyTokenService(mockedHasher)
    const result = await service.verify(verificationToken, candidateValue)

    expect(result).toBe(false)
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockedHasher.compare).toHaveBeenCalledWith(candidateValue, verificationToken.tokenHash.value)
  })

  it('should throw an error if the Hasher service fails', async () => {
    const error = new Error('Bcrypt failed unexpectedly')

    mockedHasher.compare.mockRejectedValue(error)

    const service = new VerifyTokenService(mockedHasher)
    await expect(service.verify(verificationToken, '123456')).rejects.toThrow(error)
  })
})
