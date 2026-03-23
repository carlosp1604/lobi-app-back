/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { UserSessionRepositoryInterface } from '~/src/modules/Auth/Domain/UserSessionRepositoryInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserSessionTestBuilder } from '~/src/test/modules/Auth/Domain/UserSessionTestBuilder'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { StringFormatter } from '~/src/modules/Shared/Domain/StringFormatter'
import { DomainEventRepositoryInterface } from '~/src/modules/Shared/Domain/DomainEventRepositoryInterface'
import { AuthDomainEventFactory } from '~/src/modules/Auth/Domain/AuthDomainEventFactory'
import { CloseUserSession } from '~/src/modules/Auth/Application/CloseUserSession/CloseUserSession'
import { CloseUserSessionApplicationRequestDto } from '~/src/modules/Auth/Application/CloseUserSession/CloseUserSessionApplicationRequestDto'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { DomainEventTestBuilder } from '~/src/test/modules/Shared/Domain/DomainEventTestBuilder'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { CloseUserSessionApplicationError } from '~/src/modules/Auth/Application/CloseUserSession/CloseUserSessionApplicationError'
import { ClientMetadataResponseTestBuilder } from '~/src/test/modules/Auth/Application/ClientMetadata/ClientMetadataResponseTestBuilder'

describe('CloseUserSession', () => {
  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedSessionRepository = mock<UserSessionRepositoryInterface>()
  const mockedDomainEventRepository = mock<DomainEventRepositoryInterface>()
  const mockedUnitOfWork = mock<UnitOfWork>()
  const mockedLogger = mock<LoggerServiceInterface>()
  const mockedClock = mock<ClockServiceInterface>()
  const mockedDomainEventFactory = mock<AuthDomainEventFactory>()

  const now = new Date('2026-03-12T10:15:00.000Z')
  const pastDate = new Date(now.getTime() - 3600 * 1000)
  const futureDate = new Date(now.getTime() + 3600 * 1000)
  const fakeContext: TxContext = { __opaque_tx_context: true }

  const validUserId = IdentifierMother.valid()
  const validSessionId = IdentifierMother.valid()
  const validCurrentSessionId = IdentifierMother.valid()

  let baseRequest: CloseUserSessionApplicationRequestDto
  let userBuilder: UserTestBuilder
  let sessionBuilder: UserSessionTestBuilder
  let expectedUserSession: UserSession

  let closedSessionEvent: DomainEvent

  const buildUseCase = () => {
    return new CloseUserSession(
      mockedUserRepository,
      mockedSessionRepository,
      mockedDomainEventRepository,
      mockedClock,
      mockedUnitOfWork,
      mockedLogger,
      mockedDomainEventFactory,
    )
  }

  beforeEach(() => {
    jest.restoreAllMocks()

    mockReset(mockedUserRepository)
    mockReset(mockedSessionRepository)
    mockReset(mockedDomainEventRepository)
    mockReset(mockedClock)
    mockReset(mockedUnitOfWork)
    mockReset(mockedLogger)
    mockReset(mockedDomainEventFactory)

    baseRequest = {
      userId: validUserId.value,
      sessionId: validSessionId.value,
      currentSessionId: validCurrentSessionId.value,
      clientMetadata: new ClientMetadataResponseTestBuilder().build(),
    }

    userBuilder = new UserTestBuilder().withId(validUserId)

    sessionBuilder = new UserSessionTestBuilder()
      .withId(validSessionId)
      .withUserId(validUserId)
      .withRevokedAt(null)
      .withExpiresAt(futureDate)

    mockedClock.now.mockReturnValue(now)

    mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
      return work(fakeContext)
    })

    closedSessionEvent = new DomainEventTestBuilder().build()
    mockedDomainEventFactory.createClosedSessionEvent.mockReturnValue(closedSessionEvent)

    expectedUserSession = sessionBuilder.build()

    mockedUserRepository.findByIdWithLock.mockResolvedValue(userBuilder.build())
    mockedSessionRepository.findById.mockResolvedValue(expectedUserSession)
  })

  describe('happy path', () => {
    it('should revoke session, create domain event and return success when session is active', async () => {
      const useCase = buildUseCase()

      const result = await useCase.execute(baseRequest)

      expect(result.success).toBe(true)
      expect(result['value']).toBeUndefined()

      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.findByIdWithLock).toHaveBeenCalledTimes(1)
      expect(mockedSessionRepository.findById).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventFactory.createClosedSessionEvent).toHaveBeenCalledTimes(1)
      expect(mockedSessionRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledTimes(1)

      expect(mockedUserRepository.findByIdWithLock).toHaveBeenCalledWith(validUserId.value, fakeContext)
      expect(mockedSessionRepository.findById).toHaveBeenCalledWith(validSessionId, fakeContext)

      expect(expectedUserSession.revokedAt).toEqual(now)
      expect(expectedUserSession.updatedAt).toEqual(now)

      expect(mockedDomainEventFactory.createClosedSessionEvent).toHaveBeenCalledWith(
        expectedUserSession,
        validCurrentSessionId,
        baseRequest.clientMetadata.deviceLocation,
        baseRequest.clientMetadata.userAgent,
        baseRequest.clientMetadata.userIpHash,
        now,
      )

      expect(mockedSessionRepository.save).toHaveBeenCalledWith([expectedUserSession], fakeContext)
      expect(mockedDomainEventRepository.save).toHaveBeenCalledWith(closedSessionEvent, fakeContext)

      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.error).not.toHaveBeenCalled()
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
      expect(result['error']).toStrictEqual(CloseUserSessionApplicationError.invalidUserId(expectedUserIdValidationError.message))

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
      expect(result['error']).toStrictEqual(CloseUserSessionApplicationError.invalidSessionId(expectedSessionIdValidationError.message))

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    it('should log error and return fail when currentSessionId is invalid', async () => {
      const invalidCurrentSessionId = IdentifierMother.invalid()
      const expectedSafeSample = StringFormatter.formatSafe(invalidCurrentSessionId, 60)

      const useCase = buildUseCase()
      const requestWithInvalidCurrentSessionId = { ...baseRequest, currentSessionId: invalidCurrentSessionId }

      const expectedCurrentSessionIdValidationError = SharedDomainException.invalidIdentifier(invalidCurrentSessionId)

      const result = await useCase.execute(requestWithInvalidCurrentSessionId)

      expect(mockedLogger.error).toHaveBeenCalledWith('Input validation failed', expect.any(String), {
        failedField: 'currentSessionId',
        inputValue: expectedSafeSample,
        userId: validUserId.value,
        reason: expectedCurrentSessionIdValidationError.message,
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(
        CloseUserSessionApplicationError.invalidCurrentSessionId(expectedCurrentSessionIdValidationError.message),
      )

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
      expect(result['error']).toStrictEqual(CloseUserSessionApplicationError.userNotFound())

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
      expect(result['error']).toStrictEqual(CloseUserSessionApplicationError.userDisabled())

      expect(mockedSessionRepository.findById).not.toHaveBeenCalled()
    })

    it('should log error and return fail when session is not found', async () => {
      const useCase = buildUseCase()

      mockedSessionRepository.findById.mockResolvedValue(null)

      const result = await useCase.execute(baseRequest)

      expect(mockedLogger.warn).toHaveBeenCalledWith('Session closure failed', {
        userId: validUserId.value,
        sessionId: validSessionId.value,
        reason: 'Session not found',
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(CloseUserSessionApplicationError.sessionNotFound())

      expect(mockedDomainEventFactory.createClosedSessionEvent).not.toHaveBeenCalled()
    })

    it('should log error and return fail when session does not belong to user', async () => {
      const useCase = buildUseCase()

      const anotherUserId = IdentifierMother.valid()
      const sessionWithOtherOwner = sessionBuilder.withUserId(anotherUserId).build()

      mockedSessionRepository.findById.mockResolvedValue(sessionWithOtherOwner)

      const result = await useCase.execute(baseRequest)

      expect(mockedLogger.warn).toHaveBeenCalledWith('Session closure rejected', {
        requestedUserId: validUserId.value,
        actualSessionOwner: anotherUserId.value,
        sessionId: validSessionId.value,
        reason: 'Session owner mismatch',
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(CloseUserSessionApplicationError.sessionDoesNotBelongToUser())

      expect(mockedDomainEventFactory.createClosedSessionEvent).not.toHaveBeenCalled()
    })

    it('should log warn and return fail when session cannot be revoked', async () => {
      const useCase = buildUseCase()

      const expiredSession = sessionBuilder.withExpiresAt(pastDate).build()
      mockedSessionRepository.findById.mockResolvedValue(expiredSession)

      const expectedRevocationError = UserSessionDomainException.sessionAlreadyExpired(validSessionId.value)

      const result = await useCase.execute(baseRequest)

      expect(mockedLogger.warn).toHaveBeenCalledTimes(1)
      expect(mockedLogger.warn).toHaveBeenCalledWith('Session closure rejected', {
        userId: validUserId.value,
        sessionId: validSessionId.value,
        reason: expectedRevocationError.message,
      })

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(CloseUserSessionApplicationError.cannotRevokeSession(expectedRevocationError.message))

      expect(mockedDomainEventFactory.createClosedSessionEvent).not.toHaveBeenCalled()
    })

    it('should throw error when userRepository fails during findByIdWithLock', async () => {
      const useCase = buildUseCase()

      const repositoryError = new Error('Database connection failed')

      mockedUserRepository.findByIdWithLock.mockRejectedValue(repositoryError)

      await expect(useCase.execute(baseRequest)).rejects.toThrow(repositoryError)

      expect(mockedSessionRepository.findById).not.toHaveBeenCalled()
    })

    it('should throw error when sessionRepository fails during save', async () => {
      const useCase = buildUseCase()

      const repositoryError = new Error('Database connection failed')

      mockedSessionRepository.save.mockRejectedValue(repositoryError)

      await expect(useCase.execute(baseRequest)).rejects.toThrow(repositoryError)

      expect(mockedDomainEventRepository.save).not.toHaveBeenCalled()
    })

    it('should re-throw error when session.revoke() throws unexpectedly', async () => {
      const useCase = buildUseCase()

      const session = sessionBuilder.build()
      mockedSessionRepository.findById.mockResolvedValue(session)

      const domainException = UserSessionDomainException.sessionAlreadyExpired(validSessionId.value)

      jest.spyOn(session, 'revoke').mockImplementation(() => {
        throw domainException
      })

      await expect(useCase.execute(baseRequest)).rejects.toThrow(domainException)

      expect(mockedSessionRepository.save).not.toHaveBeenCalled()
    })
  })
})
