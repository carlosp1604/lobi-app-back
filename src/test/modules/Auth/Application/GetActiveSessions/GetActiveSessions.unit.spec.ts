/* eslint @typescript-eslint/unbound-method: 0 */
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { mock, mockReset } from 'jest-mock-extended'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { GetActiveSessions } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessions'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { GetActiveSessionsApplicationError } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationError'
import { GetActiveSessionsApplicationRequestDto } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationRequestDto'

describe('GetActiveSessions', () => {
  const mockedSessionRepository = mock<UserSessionRepositoryInterface>()
  const mockedClock = mock<ClockServiceInterface>()
  const mockedLogger = mock<LoggerServiceInterface>()

  const now = new Date('2026-03-10T09:15:00.000Z')
  const futureDate = new Date(now.getTime() + 1000 * 3000)

  const validUserId = IdentifierMother.valid()
  const currentSessionId = IdentifierMother.valid()
  const otherSessionId = IdentifierMother.valid()

  let baseRequest: GetActiveSessionsApplicationRequestDto

  const buildSession = (id: Identifier) => {
    return new UserSessionTestBuilder().withId(id).withUserId(validUserId).withRevokedAt(null).withExpiresAt(futureDate).build()
  }

  const buildUseCase = () => {
    return new GetActiveSessions(mockedSessionRepository, mockedClock, mockedLogger)
  }

  beforeEach(() => {
    mockReset(mockedSessionRepository)
    mockReset(mockedClock)
    mockReset(mockedLogger)

    baseRequest = {
      userId: validUserId.value,
      currentSessionId: currentSessionId.value,
    }

    mockedClock.now.mockReturnValue(now)
    mockedSessionRepository.findUserActiveSessions.mockResolvedValue([])
  })

  describe('happy path', () => {
    it('should call repository correctly and return the correct data', async () => {
      const useCase = buildUseCase()

      const currentSession = buildSession(currentSessionId)
      const otherSession = buildSession(otherSessionId)

      mockedSessionRepository.findUserActiveSessions.mockResolvedValue([currentSession, otherSession])

      const result = await useCase.execute(baseRequest)

      expect(mockedClock.now).toHaveBeenCalledTimes(1)

      expect(mockedSessionRepository.findUserActiveSessions).toHaveBeenCalledTimes(1)
      expect(mockedSessionRepository.findUserActiveSessions).toHaveBeenCalledWith(validUserId, now)

      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.error).not.toHaveBeenCalled()

      expect(result.success).toBe(true)
      expect(result['value'].sessions).toHaveLength(2)

      expect(result['value'].sessions[0].id).toEqual(currentSession.id.value)
      expect(result['value'].sessions[0].isCurrent).toBe(true)

      expect(result['value'].sessions[1].id).toEqual(otherSession.id.value)
      expect(result['value'].sessions[1].isCurrent).toBe(false)
    })

    it('should return empty sessions array when repository returns no sessions', async () => {
      const useCase = buildUseCase()

      mockedSessionRepository.findUserActiveSessions.mockResolvedValue([])

      const result = await useCase.execute(baseRequest)

      expect(mockedSessionRepository.findUserActiveSessions).toHaveBeenCalledTimes(1)
      expect(mockedSessionRepository.findUserActiveSessions).toHaveBeenCalledWith(validUserId, now)

      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.error).not.toHaveBeenCalled()

      expect(result.success).toBe(true)
      expect(result['value'].sessions).toEqual([])
    })
  })

  describe('when there are errors', () => {
    it('should log error and return fail when userId is invalid', async () => {
      const invalidUserId = IdentifierMother.invalid()
      const expectedSafeSample = StringFormatter.formatSafe(invalidUserId, 60)

      const useCase = buildUseCase()
      const requestWithInvalidUserId = { ...baseRequest, userId: invalidUserId }

      const expectedUserIdValidationError = SharedDomainException.invalidIdentifier(invalidUserId)

      const result = await useCase.execute(requestWithInvalidUserId)

      expect(mockedLogger.error).toHaveBeenCalledWith('Input validation failed', expect.any(String), {
        failedField: 'userId',
        inputValue: expectedSafeSample,
        reason: expectedUserIdValidationError.message,
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(
        GetActiveSessionsApplicationError.invalidInput('userId', expectedUserIdValidationError.message),
      )

      expect(mockedSessionRepository.findUserActiveSessions).not.toHaveBeenCalled()
    })

    it('should return error when currentSessionId is invalid', async () => {
      const invalidSessionId = IdentifierMother.invalid()
      const expectedSafeSample = StringFormatter.formatSafe(invalidSessionId, 60)

      const useCase = buildUseCase()
      const requestWithInvalidSessionId = { ...baseRequest, currentSessionId: invalidSessionId }

      const expectedSessionIdValidationError = SharedDomainException.invalidIdentifier(invalidSessionId)

      const result = await useCase.execute(requestWithInvalidSessionId)

      expect(mockedLogger.error).toHaveBeenCalledWith('Input validation failed', expect.any(String), {
        failedField: 'currentSessionId',
        inputValue: expectedSafeSample,
        userId: validUserId.value,
        reason: expectedSessionIdValidationError.message,
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(
        GetActiveSessionsApplicationError.invalidInput('currentSessionId', expectedSessionIdValidationError.message),
      )
      expect(mockedSessionRepository.findUserActiveSessions).not.toHaveBeenCalled()
    })

    it('should throw exception when repository fails during findUserActiveSessions', async () => {
      const useCase = buildUseCase()

      const repositoryError = new Error('Database connection timeout')
      mockedSessionRepository.findUserActiveSessions.mockRejectedValue(repositoryError)

      await expect(useCase.execute(baseRequest)).rejects.toThrow(repositoryError)
    })
  })
})
