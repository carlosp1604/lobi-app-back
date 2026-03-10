/* eslint @typescript-eslint/unbound-method: 0 */
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { mock, mockReset } from 'jest-mock-extended'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { GetActiveSessions } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessions'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { GetActiveSessionsApplicationError } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationError'
import { GetActiveSessionsApplicationRequestDto } from '~/src/modules/Auth/Application/GetActiveSessions/GetActiveSessionsApplicationRequestDto'

describe('GetActiveSessions', () => {
  const mockedSessionRepository = mock<UserSessionRepositoryInterface>()
  const mockedClock = mock<ClockServiceInterface>()

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
    return new GetActiveSessions(mockedSessionRepository, mockedClock)
  }

  beforeEach(() => {
    mockReset(mockedSessionRepository)
    mockReset(mockedClock)

    baseRequest = {
      userId: validUserId.value,
      currentSessionId: currentSessionId.value,
    }

    mockedClock.now.mockReturnValue(now)
    mockedSessionRepository.findUserActiveSessions.mockResolvedValue([])
  })

  describe('happy path', () => {
    it('should read active sessions, call repository correctly and return the correct data', async () => {
      const useCase = buildUseCase()

      const currentSession = buildSession(currentSessionId)
      const otherSession = buildSession(otherSessionId)

      mockedSessionRepository.findUserActiveSessions.mockResolvedValue([currentSession, otherSession])

      const result = await useCase.execute(baseRequest)

      expect(mockedClock.now).toHaveBeenCalledTimes(1)

      expect(mockedSessionRepository.findUserActiveSessions).toHaveBeenCalledTimes(1)
      expect(mockedSessionRepository.findUserActiveSessions).toHaveBeenCalledWith(validUserId, now)

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

      expect(result.success).toBe(true)
      expect(result['value'].sessions).toHaveLength(0)

      expect(result['value'].sessions).toEqual([])
    })
  })

  describe('when there are errors', () => {
    it('should return error when userId is invalid', async () => {
      const useCase = buildUseCase()
      const requestWithInvalidUserId = { ...baseRequest, userId: IdentifierMother.invalid() }

      const result = await useCase.execute(requestWithInvalidUserId)

      expect(result).toEqual({
        success: false,
        error: GetActiveSessionsApplicationError.invalidInput(),
      })

      expect(mockedSessionRepository.findUserActiveSessions).not.toHaveBeenCalled()
    })

    it('should return error when currentSessionId is invalid', async () => {
      const useCase = buildUseCase()
      const requestWithInvalidSessionId = { ...baseRequest, currentSessionId: IdentifierMother.invalid() }

      const result = await useCase.execute(requestWithInvalidSessionId)

      expect(result).toEqual({
        success: false,
        error: GetActiveSessionsApplicationError.invalidInput(),
      })

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
