/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { RevokeSession } from '~/src/modules/Auth/Application/RevokeSession/RevokeSession'
import { RevokeSessionApplicationRequestDto } from '~/src/modules/Auth/Application/RevokeSession/RevokeSessionApplicationRequestDto'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { RevokeSessionApplicationError } from '~/src/modules/Auth/Application/RevokeSession/RevokeSessionApplicationError'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'

describe('RevokeSession', () => {
  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedSessionRepository = mock<UserSessionRepositoryInterface>()
  const mockedClock = mock<ClockServiceInterface>()
  const mockedUnitOfWork = mock<UnitOfWork>()
  const mockedLogger = mock<LoggerServiceInterface>()

  const now = new Date('2026-03-09T11:15:00.000Z')
  const pastDate = new Date(now.getTime() - 3600 * 1000)
  const fakeContext: TxContext = { __opaque_tx_context: true }

  const validUserId = IdentifierMother.valid()
  const validSessionId = IdentifierMother.valid()

  let baseRequest: RevokeSessionApplicationRequestDto
  let userBuilder: UserTestBuilder
  let sessionBuilder: UserSessionTestBuilder

  const buildUseCase = () => {
    return new RevokeSession(mockedUserRepository, mockedSessionRepository, mockedClock, mockedUnitOfWork, mockedLogger)
  }

  beforeEach(() => {
    jest.restoreAllMocks()

    mockReset(mockedUserRepository)
    mockReset(mockedSessionRepository)
    mockReset(mockedClock)
    mockReset(mockedUnitOfWork)
    mockReset(mockedLogger)

    baseRequest = {
      userId: validUserId.value,
      sessionId: validSessionId.value,
    }

    userBuilder = new UserTestBuilder().withId(validUserId)

    sessionBuilder = new UserSessionTestBuilder()
      .withId(validSessionId)
      .withUserId(validUserId)
      .withRevokedAt(null)
      .withExpiresAt(new Date(now.getTime() + 3600 * 1000))

    mockedClock.now.mockReturnValue(now)

    mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
      return work(fakeContext)
    })

    mockedUserRepository.findByIdWithLock.mockResolvedValue(userBuilder.build())
    mockedSessionRepository.findById.mockResolvedValue(sessionBuilder.build())
  })

  describe('happy path', () => {
    it('should revoke session and return success when session is active', async () => {
      const useCase = buildUseCase()

      const session = sessionBuilder.build()
      mockedSessionRepository.findById.mockResolvedValue(session)

      const result = await useCase.execute(baseRequest)

      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.findByIdWithLock).toHaveBeenCalledTimes(1)
      expect(mockedSessionRepository.findById).toHaveBeenCalledTimes(1)
      expect(mockedSessionRepository.save).toHaveBeenCalledTimes(1)

      expect(mockedUserRepository.findByIdWithLock).toHaveBeenCalledWith(validUserId.value, fakeContext)
      expect(mockedSessionRepository.findById).toHaveBeenCalledWith(validSessionId, fakeContext)

      expect(session.revokedAt?.getTime()).toEqual(now.getTime())
      expect(session.updatedAt?.getTime()).toEqual(now.getTime())

      expect(mockedSessionRepository.save).toHaveBeenCalledWith([session], fakeContext)

      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.error).not.toHaveBeenCalled()

      expect(result.success).toBe(true)
      expect(result['value']).toBeUndefined()
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
      expect(result['error']).toEqual(RevokeSessionApplicationError.invalidInput('userId', expectedUserIdValidationError.message))

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    it('should log error and return fail when sessionId is invalid', async () => {
      const invalidSessionId = IdentifierMother.invalid()
      const expectedSafeSample = StringFormatter.formatSafe(invalidSessionId, 60)

      const useCase = buildUseCase()
      const requestWithInvalidSessionId = { ...baseRequest, sessionId: invalidSessionId }

      const expectedSessionIdValidationError = SharedDomainException.invalidIdentifier(invalidSessionId)

      const result = await useCase.execute(requestWithInvalidSessionId)

      expect(mockedLogger.error).toHaveBeenCalledWith('Input validation failed', expect.any(String), {
        failedField: 'sessionId',
        inputValue: expectedSafeSample,
        userId: validUserId.value,
        reason: expectedSessionIdValidationError.message,
      })

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(RevokeSessionApplicationError.invalidInput('sessionId', expectedSessionIdValidationError.message))

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    it('should log warn and return fail when user is not found', async () => {
      const useCase = buildUseCase()

      mockedUserRepository.findByIdWithLock.mockResolvedValue(null)

      const result = await useCase.execute(baseRequest)

      expect(mockedLogger.warn).toHaveBeenCalledWith('Inconsistent state', {
        userId: validUserId.value,
        reason: 'User not found',
      })

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(RevokeSessionApplicationError.userNotFound(validUserId.value))

      expect(mockedSessionRepository.findById).not.toHaveBeenCalled()
    })

    it('should log warn and and return fail success when user is disabled', async () => {
      const useCase = buildUseCase()

      const disabledUser = userBuilder.withStatus(UserStatus.deactivated()).build()
      mockedUserRepository.findByIdWithLock.mockResolvedValue(disabledUser)

      const result = await useCase.execute(baseRequest)

      expect(mockedLogger.warn).toHaveBeenCalledWith('Inconsistent state', {
        userId: validUserId.value,
        reason: 'User is disabled',
      })

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(RevokeSessionApplicationError.userDisabled(validUserId.value))

      expect(mockedSessionRepository.findById).not.toHaveBeenCalled()
    })

    it('should log error and return fail when session is not found', async () => {
      const useCase = buildUseCase()

      mockedSessionRepository.findById.mockResolvedValue(null)

      const result = await useCase.execute(baseRequest)

      expect(mockedLogger.warn).toHaveBeenCalledWith('Session revocation failed', {
        userId: validUserId.value,
        sessionId: validSessionId.value,
        reason: 'Session not found',
      })

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(RevokeSessionApplicationError.sessionNotFound(validSessionId.value))

      expect(mockedSessionRepository.save).not.toHaveBeenCalled()
    })

    it('should log error and return fail when session does not belong to user', async () => {
      const useCase = buildUseCase()

      const anotherUserId = IdentifierMother.valid()
      const sessionWithOtherOwner = sessionBuilder.withUserId(anotherUserId).build()

      mockedSessionRepository.findById.mockResolvedValue(sessionWithOtherOwner)

      const result = await useCase.execute(baseRequest)

      expect(mockedLogger.warn).toHaveBeenCalledWith('Session revocation rejected', {
        requestedUserId: validUserId.value,
        actualSessionOwner: anotherUserId.value,
        sessionId: validSessionId.value,
        reason: 'Session owner mismatch',
      })

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(RevokeSessionApplicationError.sessionDoesNotBelongToUser(validSessionId.value, validUserId.value))

      expect(mockedSessionRepository.save).not.toHaveBeenCalled()
    })

    it('should log warn and return fail when session cannot be revoked', async () => {
      const useCase = buildUseCase()

      const expiredSession = sessionBuilder.withExpiresAt(pastDate).build()
      mockedSessionRepository.findById.mockResolvedValue(expiredSession)

      const expectedRevocationError = UserSessionDomainException.sessionAlreadyExpired(validSessionId.value)

      const result = await useCase.execute(baseRequest)

      expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
      expect(mockedLogger.warn).toHaveBeenCalledWith('Session revocation rejected', {
        userId: validUserId.value,
        sessionId: validSessionId.value,
        reason: expectedRevocationError.message,
      })

      expect(result.success).toBe(false)
      expect(result['error']).toEqual(RevokeSessionApplicationError.cannotRevokeSession(expectedRevocationError.message))

      expect(mockedSessionRepository.save).not.toHaveBeenCalled()
    })

    it('should throw error when repository fails during findByIdWithLock', async () => {
      const useCase = buildUseCase()

      const repositoryError = new Error('Database connection failed')

      mockedUserRepository.findByIdWithLock.mockRejectedValue(repositoryError)

      await expect(useCase.execute(baseRequest)).rejects.toThrow(repositoryError)

      expect(mockedSessionRepository.findById).not.toHaveBeenCalled()
    })

    it('should re-throw error when session.revoke() throws unexpectedly', async () => {
      const useCase = buildUseCase()

      const session = sessionBuilder.build()
      mockedSessionRepository.findById.mockResolvedValue(session)

      const domainException = UserSessionDomainException.sessionAlreadyRevoked(validSessionId.value)

      jest.spyOn(session, 'revoke').mockImplementation(() => {
        throw domainException
      })

      await expect(useCase.execute(baseRequest)).rejects.toThrow(domainException)

      expect(mockedSessionRepository.save).not.toHaveBeenCalled()
    })
  })
})
