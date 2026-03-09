/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { LogoutUser } from '~/src/modules/Auth/Application/LogoutUser/LogoutUser'
import { LogoutUserApplicationRequestDto } from '~/src/modules/Auth/Application/LogoutUser/LogoutUserApplicationRequestDto'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { IdentifierMother } from '~/src/test/mothers/Shared/IdentifierMother'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { LogoutUserApplicationError } from '~/src/modules/Auth/Application/LogoutUser/LogoutUserApplicationError'

describe('LogoutUser', () => {
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

  let baseRequest: LogoutUserApplicationRequestDto
  let userBuilder: UserTestBuilder
  let sessionBuilder: UserSessionTestBuilder

  const buildUseCase = () => {
    return new LogoutUser(mockedUserRepository, mockedSessionRepository, mockedClock, mockedUnitOfWork, mockedLogger)
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
    const checkCommonCalls = () => {
      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.findByIdWithLock).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.findByIdWithLock).toHaveBeenCalledWith(validUserId.value, fakeContext)

      expect(mockedSessionRepository.findById).toHaveBeenCalledTimes(1)
      expect(mockedSessionRepository.findById).toHaveBeenCalledWith(validSessionId, fakeContext)
    }

    it('should revoke session and return success when session is active', async () => {
      const useCase = buildUseCase()

      const session = sessionBuilder.build()
      mockedSessionRepository.findById.mockResolvedValue(session)

      const revokeSpy = jest.spyOn(session, 'revoke')

      const result = await useCase.execute(baseRequest)

      checkCommonCalls()

      expect(revokeSpy).toHaveBeenCalledTimes(1)
      expect(revokeSpy).toHaveBeenCalledWith(now)

      expect(session.revokedAt?.getTime()).toEqual(now.getTime())
      expect(session.updatedAt?.getTime()).toEqual(now.getTime())

      expect(mockedSessionRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedSessionRepository.save).toHaveBeenCalledWith([session], fakeContext)

      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.error).not.toHaveBeenCalled()

      expect(result.success).toBe(true)
      expect(result['value']).toBeUndefined()
    })

    it('should return success when session cannot be revoked', async () => {
      const useCase = buildUseCase()

      const expiredSession = sessionBuilder.withExpiresAt(pastDate).build()
      mockedSessionRepository.findById.mockResolvedValue(expiredSession)

      const result = await useCase.execute(baseRequest)

      checkCommonCalls()

      expect(mockedSessionRepository.save).not.toHaveBeenCalled()

      expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
      expect(mockedLogger.warn).toHaveBeenCalledWith('Logout rejected', {
        userId: baseRequest.userId,
        sessionId: baseRequest.sessionId,
        reason: UserSessionDomainException.sessionAlreadyExpired(validSessionId.value).message,
      })

      expect(result.success).toBe(true)
      expect(result['value']).toBeUndefined()
    })
  })

  describe('when there are errors', () => {
    describe('invalid input', () => {
      it('should fail and log error when userId is invalid', async () => {
        const invalidUserId = IdentifierMother.invalid()

        const useCase = buildUseCase()
        const requestWithInvalidUserId = { ...baseRequest, userId: invalidUserId }

        const expectedUserIdResult = Identifier.safeCreate(invalidUserId)

        const result = await useCase.execute(requestWithInvalidUserId)

        expect(mockedLogger.error).toHaveBeenCalledWith('Inconsistent state', expect.any(String), {
          rawUserId: invalidUserId,
          reason: 'Valid JWT contains malformed identifiers',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          message: !expectedUserIdResult.success ? expectedUserIdResult.error.message : expect.any(String),
        })

        expect(result.success).toBe(false)
        expect(result['error']).toEqual(LogoutUserApplicationError.invalidInput())

        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      })

      it('should fail and log error when sessionId is invalid', async () => {
        const invalidSessionId = IdentifierMother.invalid()

        const useCase = buildUseCase()
        const requestWithInvalidSessionId = { ...baseRequest, sessionId: invalidSessionId }

        const expectedSessionIdResult = Identifier.safeCreate(invalidSessionId)

        const result = await useCase.execute(requestWithInvalidSessionId)

        expect(mockedLogger.error).toHaveBeenCalledWith('Inconsistent state', expect.any(String), {
          rawSessionId: invalidSessionId,
          reason: 'Valid JWT contains malformed identifiers',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          message: !expectedSessionIdResult.success ? expectedSessionIdResult.error.message : expect.any(String),
        })

        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
        expect(result.success).toBe(false)
        expect(result['error']).toEqual(LogoutUserApplicationError.invalidInput())
      })
    })

    describe('user state invalid', () => {
      it('should log warn and return success when user is not found', async () => {
        const useCase = buildUseCase()

        mockedUserRepository.findByIdWithLock.mockResolvedValue(null)

        const result = await useCase.execute(baseRequest)

        expect(mockedLogger.warn).toHaveBeenCalledWith('Inconsistent state', {
          userId: baseRequest.userId,
          reason: 'User not found',
        })

        expect(result.success).toBe(true)
        expect(result['value']).toBeUndefined()

        expect(mockedSessionRepository.findById).not.toHaveBeenCalled()
      })

      it('should log warn and return success when user is disabled', async () => {
        const useCase = buildUseCase()

        const disabledUser = userBuilder.withStatus(UserStatus.deactivated()).build()
        mockedUserRepository.findByIdWithLock.mockResolvedValue(disabledUser)

        const result = await useCase.execute(baseRequest)

        expect(mockedLogger.warn).toHaveBeenCalledWith('Inconsistent state', {
          userId: baseRequest.userId,
          reason: 'User is disabled',
        })

        expect(result.success).toBe(true)
        expect(result['value']).toBeUndefined()

        expect(mockedSessionRepository.findById).not.toHaveBeenCalled()
      })
    })

    describe('session state invalid', () => {
      it('should log error and return fail when session is not found', async () => {
        const useCase = buildUseCase()

        mockedSessionRepository.findById.mockResolvedValue(null)

        const result = await useCase.execute(baseRequest)

        expect(mockedLogger.error).toHaveBeenCalledWith('Inconsistent state', undefined, {
          userId: baseRequest.userId,
          sessionId: baseRequest.sessionId,
          reason: 'Valid JWT references a non-existent session',
        })

        expect(result.success).toBe(false)
        expect(result['error']).toEqual(LogoutUserApplicationError.sessionNotFound(validSessionId.value))

        expect(mockedSessionRepository.save).not.toHaveBeenCalled()
      })

      it('should log error, return fail when session does not belong to user', async () => {
        const useCase = buildUseCase()

        const anotherUserId = IdentifierMother.valid()
        const sessionWithOtherOwner = sessionBuilder.withUserId(anotherUserId).build()

        mockedSessionRepository.findById.mockResolvedValue(sessionWithOtherOwner)

        const result = await useCase.execute(baseRequest)

        expect(mockedLogger.error).toHaveBeenCalledWith('Inconsistent state', undefined, {
          requestedUserId: baseRequest.userId,
          actualSessionOwner: anotherUserId.value,
          sessionId: baseRequest.sessionId,
          reason: 'Session owner mismatch during logout',
        })

        expect(result.success).toBe(false)
        expect(result['error']).toEqual(LogoutUserApplicationError.sessionDoesNotBelongToUser(validSessionId.value, validUserId.value))

        expect(mockedSessionRepository.save).not.toHaveBeenCalled()
      })
    })

    it('should throw error if repository fails during findByIdWithLock', async () => {
      const useCase = buildUseCase()

      const repositoryError = new Error('Database connection failed')
      mockedUserRepository.findByIdWithLock.mockRejectedValue(repositoryError)

      await expect(useCase.execute(baseRequest)).rejects.toThrow(repositoryError)

      expect(mockedSessionRepository.findById).not.toHaveBeenCalled()
    })

    it('should re-throw error if session.revoke() throws unexpectedly', async () => {
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
