/* eslint @typescript-eslint/unbound-method: 0 */
import { mock, mockReset } from 'jest-mock-extended'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { SportRepositoryInterface } from '~/src/modules/Activity/Domain/Sport/SportRepositoryInterface'
import { ActivityRepositoryInterface } from '~/src/modules/Activity/Domain/ActivityRepositoryInterface'
import { ParticipationRepositoryInterface } from '~/src/modules/Activity/Domain/Participation/ParticipationRepositoryInterface'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { SportRegistry } from '~/src/modules/Activity/Application/Sport/SportRegistry'
import {
  CreateActivityApplicationError,
  CreateActivityInputError,
} from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationError'
import { CreateActivityApplicationRequestDto } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationRequestDto'
import { TxContext } from '~/src/modules/Shared/Application/TxContext'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { ActivityTitleMother } from '~/src/test/mothers/Domain/Activity/ActivityTitleMother'
import { ActivityDescriptionMother } from '~/src/test/mothers/Domain/Activity/ActivityDescriptionMother'
import { ActivityScheduledDateMother } from '~/src/test/mothers/Domain/Activity/ActivityScheduledDateMother'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { SportTestBuilder } from '~/src/test/modules/Activity/Domain/Sport/SportTestBuilder'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { Result } from '~/src/modules/Shared/Domain/Result'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { CreateActivity } from '~/src/modules/Activity/Application/CreateActivity/CreateActivity'
import { DurationCapabilityMother } from '~/src/test/mothers/Application/Activity/Sport/DurationCapabilityMother'
import { SportParticipantsDefinitionMother } from '~/src/test/mothers/Domain/Activity/Sport/SportParticipantsDefinitionMother'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { ActivityScheduledDate } from '~/src/modules/Activity/Domain/ValueObject/ActivityScheduledDate'
import { ActivityTitle } from '~/src/modules/Activity/Domain/ValueObject/ActivityTitle'
import { LocationCapabilityMother } from '~/src/test/mothers/Application/Activity/Sport/LocationCapabilityMother'
import { ActivityDescription } from '~/src/modules/Activity/Domain/ValueObject/ActivityDescription'
import { ParticipantsSpecMother } from '~/src/test/mothers/Application/Activity/Sport/ParticipantsSpecMother'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { IndividualParticipation } from '~/src/modules/Activity/Domain/Sport/IndividualParticipation'
import { CreateActivityApplicationResponseDto } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationResponseDto'

describe('CreateActivity', () => {
  const mockedUserRepository = mock<UserRepositoryInterface>()
  const mockedSportRepository = mock<SportRepositoryInterface>()
  const mockedActivityRepository = mock<ActivityRepositoryInterface>()
  const mockedParticipationRepository = mock<ParticipationRepositoryInterface>()
  const mockedClock = mock<ClockServiceInterface>()
  const mockedUnitOfWork = mock<UnitOfWork>()
  const mockedLogger = mock<LoggerServiceInterface>()
  const mockedIdGeneratorService = mock<IdGeneratorServiceInterface>()

  const now = new Date('2025-04-29T10:04:05.000Z')
  const fakeContext: TxContext = { __opaque_tx_context: true }

  const validUserId = IdentifierMother.valid()
  const validSportId = IdentifierMother.valid()
  const validActivityId = IdentifierMother.valid()
  const validParticipationId = IdentifierMother.valid()
  const validDomainEventId = IdentifierMother.valid()
  const validTitle = ActivityTitleMother.validString()
  const validDescription = ActivityDescriptionMother.validString()
  const validScheduledDate = ActivityScheduledDateMother.validDate(now)

  const validDurationData = DurationCapabilityMother.validData()
  const validLocationData = LocationCapabilityMother.validData()
  const validParticipantsData = ParticipantsSpecMother.validData()

  let userTestBuilder: UserTestBuilder
  let sportTestBuilder: SportTestBuilder
  let request: CreateActivityApplicationRequestDto

  const buildUseCase = () => {
    return new CreateActivity(
      mockedUserRepository,
      mockedSportRepository,
      mockedActivityRepository,
      mockedParticipationRepository,
      mockedClock,
      mockedUnitOfWork,
      mockedLogger,
      mockedIdGeneratorService,
    )
  }

  beforeEach(() => {
    mockReset(mockedUserRepository)
    mockReset(mockedSportRepository)
    mockReset(mockedActivityRepository)
    mockReset(mockedParticipationRepository)
    mockReset(mockedClock)
    mockReset(mockedUnitOfWork)
    mockReset(mockedLogger)
    mockReset(mockedIdGeneratorService)

    userTestBuilder = new UserTestBuilder().withId(validUserId).withStatus(UserStatus.active())

    sportTestBuilder = new SportTestBuilder()
      .withId(validSportId)
      .withCapabilities(['duration', 'location'])
      .withSpecs({ participants: SportParticipantsDefinitionMother.valid() })

    const expectedUser = userTestBuilder.build()
    const expectedSport = sportTestBuilder.build()

    mockedClock.now.mockReturnValue(now)
    mockedUserRepository.findById.mockResolvedValue(expectedUser)
    mockedSportRepository.findById.mockResolvedValue(expectedSport)

    mockedIdGeneratorService.generateId
      .mockReturnValueOnce(validActivityId.value)
      .mockReturnValueOnce(validDomainEventId.value)
      .mockReturnValueOnce(validParticipationId.value)

    mockedUnitOfWork.runInTransaction.mockImplementation(async (work) => {
      return work(fakeContext)
    })

    request = {
      userId: validUserId.value,
      sportId: validSportId.value,
      title: validTitle,
      description: validDescription,
      scheduledDate: validScheduledDate,
      config: {
        capabilities: { duration: validDurationData, location: validLocationData },
        specs: { participants: validParticipantsData },
      },
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('happy path', () => {
    const checkCommonCalls = () => {
      expect(mockedClock.now).toHaveBeenCalledTimes(1)
      expect(mockedSportRepository.findById).toHaveBeenCalledTimes(1)
      expect(mockedUnitOfWork.runInTransaction).toHaveBeenCalledTimes(1)
      expect(mockedUserRepository.findById).toHaveBeenCalledTimes(1)
      expect(mockedIdGeneratorService.generateId).toHaveBeenCalledTimes(3)
      expect(mockedActivityRepository.save).toHaveBeenCalledTimes(1)
      expect(mockedParticipationRepository.save).toHaveBeenCalledTimes(1)

      expect(mockedSportRepository.findById).toHaveBeenCalledWith(validSportId)
      expect(mockedUserRepository.findById).toHaveBeenCalledWith(validUserId, fakeContext)
      expect(mockedActivityRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: validActivityId }), fakeContext)
      expect(mockedParticipationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: validParticipationId,
          activityId: validActivityId,
          userId: validUserId,
          joinedAt: now,
        }),
        fakeContext,
      )

      expect(mockedLogger.warn).not.toHaveBeenCalled()
      expect(mockedLogger.error).not.toHaveBeenCalled()
    }

    const checkResult = (result: Result<CreateActivityApplicationResponseDto, CreateActivityApplicationError>) => {
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.value.activity).toBeDefined()

        const activity = result.value.activity

        expect(activity.id).toBe(validActivityId.value)
        expect(activity.title).toBe(validTitle)
        expect(activity.sportId).toBe(validSportId.value)
        expect(activity.scheduledAt).toEqual(validScheduledDate)
        expect(activity.config.specs.participants).toBeDefined()
        expect(activity.config.capabilities.location).toBeDefined()
        expect(activity.config.capabilities.duration).toBeDefined()

        expect(result.value.participation).toBeDefined()

        const participation = result.value.participation

        expect(participation.id).toBe(validParticipationId.value)
        expect(participation.activityId).toBe(validActivityId.value)
        expect(participation.userId).toBe(validUserId.value)
        expect(participation.joinedAt).toBe(now)
        expect(participation.leftAt).toBe(null)

        expect(result.value.isUserAdmin).toBe(true)
        expect(result.value.isUserParticipating).toBe(true)
      }
    }

    it('should create activity and participation successfully', async () => {
      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      checkCommonCalls()
      checkResult(result)
    })

    it('should create activity successfully without description', async () => {
      const requestWithoutDescription = { ...request, description: null }
      const useCase = buildUseCase()
      const result = await useCase.execute(requestWithoutDescription)

      checkCommonCalls()
      checkResult(result)
    })
  })

  describe('when there are errors', () => {
    describe('when input data is invalid', () => {
      it('should return error when userId and sportId are invalid', async () => {
        const invalidUserId = IdentifierMother.invalid()
        const invalidSportId = IdentifierMother.invalid()

        const expectedUserErrorMessage = SharedDomainException.invalidIdentifier(invalidUserId).message
        const expectedSportErrorMessage = SharedDomainException.invalidIdentifier(invalidSportId).message

        const useCase = buildUseCase()
        const result = await useCase.execute({ ...request, userId: invalidUserId, sportId: invalidSportId })

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateActivityApplicationError.invalidInput([
            CreateActivityInputError.validationError('userId', expectedUserErrorMessage),
            CreateActivityInputError.validationError('sportId', expectedSportErrorMessage),
          ]),
        )

        expect(mockedSportRepository.findById).not.toHaveBeenCalled()
        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      })

      it('should return error when activity scheduled date is an invalid date', async () => {
        const useCase = buildUseCase()
        const result = await useCase.execute({
          ...request,
          scheduledDate: new Date(NaN),
        })

        const expectedDomainErrorMessage = ActivityDomainException.invalidActivityScheduledDate().message

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateActivityApplicationError.invalidInput([
            CreateActivityInputError.validationError('scheduledDate', expectedDomainErrorMessage),
          ]),
        )
      })

      it('should return error when activity title is invalid', async () => {
        const useCase = buildUseCase()

        const invalidActivityTitle = ActivityTitleMother.tooShort()
        const result = await useCase.execute({
          ...request,
          title: invalidActivityTitle,
        })

        const expectedDomainErrorMessage = ActivityDomainException.invalidActivityTitle(
          invalidActivityTitle,
          ActivityTitle.MIN_LENGTH,
          ActivityTitle.MAX_LENGTH,
        ).message

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateActivityApplicationError.invalidInput([CreateActivityInputError.validationError('title', expectedDomainErrorMessage)]),
        )
      })

      it('should return error when activity description is invalid', async () => {
        const useCase = buildUseCase()

        const invalidActivityDescription = ActivityDescriptionMother.tooShort()
        const result = await useCase.execute({
          ...request,
          description: invalidActivityDescription,
        })

        const expectedDomainErrorMessage = ActivityDomainException.invalidActivityDescription(
          invalidActivityDescription,
          ActivityDescription.MIN_LENGTH,
          ActivityDescription.MAX_LENGTH,
        ).message

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateActivityApplicationError.invalidInput([
            CreateActivityInputError.validationError('description', expectedDomainErrorMessage),
          ]),
        )
      })

      it('should return error when participants spec is missing', async () => {
        const useCase = buildUseCase()
        const result = await useCase.execute({
          ...request,
          config: {
            ...request.config,
            specs: {},
          },
        })

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateActivityApplicationError.invalidInput([CreateActivityInputError.missingSpecError('config.specs.participants')]),
        )
      })

      it('should return error when participants spec data is invalid', async () => {
        const useCase = buildUseCase()

        const invalidParticipantsData = ParticipantsSpecMother.invalidData()
        const result = await useCase.execute({
          ...request,
          config: {
            ...request.config,
            specs: { participants: invalidParticipantsData },
          },
        })

        const expectedDomainMessageError = SportDomainException.invalidTeamsMinPlayers(
          invalidParticipantsData.minPlayersToPlay!,
          IndividualParticipation.MIN_PLAYERS_REQUIRED.value,
          invalidParticipantsData.teams!.minTeams! * invalidParticipantsData.teams!.playersPerTeam!,
        ).message

        expect(result.success).toBe(false)
        expect(result['error']).toEqual(
          CreateActivityApplicationError.invalidInput([
            CreateActivityInputError.validationError('config.specs.participants', expectedDomainMessageError),
          ]),
        )
      })

      it('should return error when config is invalid', async () => {
        const useCase = buildUseCase()

        const sportWithOtherCapabilities = sportTestBuilder.withCapabilities(['route', 'rpe']).build()
        mockedSportRepository.findById.mockResolvedValue(sportWithOtherCapabilities)

        const result = await useCase.execute(request)

        const expectedDomainMessageError = SportDomainException.unsupportedCapabilities(
          sportWithOtherCapabilities.id.value,
          ['duration', 'location'],
          sportWithOtherCapabilities.capabilities,
        ).message

        expect(result.success).toBe(false)
        expect(result['error']).toEqual(
          CreateActivityApplicationError.invalidInput([CreateActivityInputError.validationError('config', expectedDomainMessageError)]),
        )
      })

      it('should return error for unsupported capability and unsupported spec', async () => {
        const useCase = buildUseCase()
        const result = await useCase.execute({
          ...request,
          config: {
            capabilities: { flying: true },
            specs: { participants: validParticipantsData, substitutions: { min: 0, max: 5 } },
          },
        })

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateActivityApplicationError.invalidInput([
            CreateActivityInputError.unavailableError('config.capabilities.flying', 'capability'),
            CreateActivityInputError.unavailableError('config.specs.unknownSpec', 'spec'),
          ]),
        )
      })

      it('should throw critical error when available capability validator is not registered', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        jest.spyOn(SportRegistry, 'getCapability').mockReturnValue(null as any)

        const useCase = buildUseCase()

        await expect(useCase.execute(request)).rejects.toThrow(
          // eslint-disable-next-line quotes
          Error("System error: Capability validator for 'duration' is not registered"),
        )

        expect(mockedLogger.error).toHaveBeenCalledWith('Invalid configuration', expect.anything(), {
          capabilityName: 'duration',
          // eslint-disable-next-line quotes
          reason: "Capability validator for 'duration' is not registered",
        })
      })

      it('should accumulate errors for invalid title, past date, and invalid capability data', async () => {
        const invalidTitle = ActivityTitleMother.tooLong()
        const pastDate = ActivityScheduledDateMother.pastDate(now)
        const invalidDurationRange = DurationCapabilityMother.invalidData()

        const useCase = buildUseCase()
        const result = await useCase.execute({
          ...request,
          title: invalidTitle,
          scheduledDate: pastDate,
          config: {
            ...request.config,
            capabilities: {
              duration: invalidDurationRange,
              location: validLocationData,
            },
          },
        })

        const expectedScheduledDateErrorMessage = ActivityDomainException.scheduledDateOutOfRange(
          pastDate.toISOString(),
          ActivityScheduledDate.MIN_MARGIN_MINUTES,
          ActivityScheduledDate.MAX_FUTURE_DAYS,
        ).message
        const expectedTitleErrorMessage = ActivityDomainException.invalidActivityTitle(
          invalidTitle,
          ActivityTitle.MIN_LENGTH,
          ActivityTitle.MAX_LENGTH,
        ).message
        const expectedInvalidCapabilityErrorMessage = SharedDomainException.invalidMagnitudeRange(
          invalidDurationRange.start.toString(),
          invalidDurationRange.end!.toString(),
        ).message

        expect(result.success).toBe(false)
        expect(result['error']).toStrictEqual(
          CreateActivityApplicationError.invalidInput([
            CreateActivityInputError.validationError('scheduledDate', expectedScheduledDateErrorMessage),
            CreateActivityInputError.validationError('title', expectedTitleErrorMessage),
            CreateActivityInputError.validationError('config.capabilities.duration', expectedInvalidCapabilityErrorMessage),
          ]),
        )

        expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
      })
    })

    it('should return error when sport does not exist', async () => {
      mockedSportRepository.findById.mockResolvedValue(null)

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(CreateActivityApplicationError.sportNotFound())

      expect(mockedUnitOfWork.runInTransaction).not.toHaveBeenCalled()
    })

    it('should return and log error when user does not exist', async () => {
      mockedUserRepository.findById.mockResolvedValue(null)

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(CreateActivityApplicationError.userNotFound())
      expect(mockedActivityRepository.save).not.toHaveBeenCalled()

      expect(mockedLogger.warn).toHaveBeenCalledWith('Inconsistent state', {
        id: validUserId.value,
        reason: 'User not found',
      })
    })

    it('should return error and log warn when user is disabled', async () => {
      const disabledUser = userTestBuilder.withStatus(UserStatus.deactivated()).build()
      mockedUserRepository.findById.mockResolvedValue(disabledUser)

      const useCase = buildUseCase()
      const result = await useCase.execute(request)

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(CreateActivityApplicationError.userDisabled())
      expect(mockedActivityRepository.save).not.toHaveBeenCalled()

      expect(mockedLogger.warn).toHaveBeenCalledWith('Inconsistent state', {
        id: validUserId.value,
        reason: 'User is disabled',
      })
    })

    describe('when dependencies fail', () => {
      it('should throw error when UnitOfWork fails', async () => {
        const dbError = Error('DB Connection Lost')

        mockedUnitOfWork.runInTransaction.mockImplementationOnce(() => {
          throw dbError
        })

        const useCase = buildUseCase()

        await expect(useCase.execute(request)).rejects.toThrow(dbError)
      })

      it('should throw error when SportRepository fails', async () => {
        const unexpectedRepositoryError = Error('Unexpected Error')

        mockedSportRepository.findById.mockImplementationOnce(() => {
          throw unexpectedRepositoryError
        })

        const useCase = buildUseCase()

        await expect(useCase.execute(request)).rejects.toThrow(unexpectedRepositoryError)
      })
    })
  })
})
