/* eslint @typescript-eslint/unbound-method: 0 */
import { GetSports } from '~/src/modules/Activity/Application/GetSports/GetSports'
import { CreateActivity } from '~/src/modules/Activity/Application/CreateActivity/CreateActivity'
import { mock, mockReset } from 'jest-mock-extended'
import type { JwtPayload } from '~/src/modules/Auth/Infrastructure/jwt-payload.schema'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { ActivityController } from '~/src/modules/Activity/Infrastructure/activity.controller'
import { ActivityTitleMother } from '~/src/test/mothers/Domain/Activity/ActivityTitleMother'
import { UNAUTHORIZED_ACCESS } from '~/src/modules/Shared/Infrastructure/ApiCodes'
import { CreateActivityBodyDto } from '~/src/modules/Activity/Infrastructure/Dtos/create-activity-body.dto'
import { GetSportsApplicationResponseDto } from '~/src/modules/Activity/Application/GetSports/GetSportsApplicationResponseDto'
import { CreateActivityApplicationResponseDto } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationResponseDto'
import { UnauthorizedException, UnprocessableEntityException, InternalServerErrorException } from '@nestjs/common'
import {
  CreateActivityApplicationError,
  CreateActivityInputError,
} from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationError'
import {
  ACTIVITY_CREATE_ACTIVITY_INVALID_INPUT,
  ACTIVITY_CREATE_ACTIVITY_SPORT_NOT_FOUND,
} from '~/src/modules/Activity/Infrastructure/ApiCodes'
import { SportApplicationDto } from '~/src/modules/Activity/Application/Dto/SportApplicationDto'

describe('ActivityController', () => {
  const mockedCreateActivityUseCase = mock<CreateActivity>()
  const mockedGetSportsUseCase = mock<GetSports>()

  const buildController = () => {
    return new ActivityController(mockedCreateActivityUseCase, mockedGetSportsUseCase)
  }

  beforeEach(() => {
    mockReset(mockedCreateActivityUseCase)
    mockReset(mockedGetSportsUseCase)
  })

  describe('create', () => {
    const validUserId = IdentifierMother.validString()
    const mockAccessToken = { sub: validUserId } as JwtPayload

    const mockBody: CreateActivityBodyDto = {
      sportId: IdentifierMother.validString(),
      title: ActivityTitleMother.validString(),
      description: null,
      scheduledDate: new Date(),
      config: {
        capabilities: {},
        specs: {},
      },
    }

    const expectedUseCaseResponse = {
      activity: { id: IdentifierMother.validString() },
      participation: { id: IdentifierMother.validString() },
      isUserAdmin: true,
      isUserParticipating: true,
    } as unknown as CreateActivityApplicationResponseDto

    describe('happy path', () => {
      beforeEach(() => {
        mockedCreateActivityUseCase.execute.mockResolvedValue({
          success: true,
          value: expectedUseCaseResponse,
        })
      })

      it('should call use-case correctly and return data', async () => {
        const controller = buildController()

        const result = await controller.create(mockAccessToken, mockBody)

        expect(mockedCreateActivityUseCase.execute).toHaveBeenCalledTimes(1)
        expect(mockedCreateActivityUseCase.execute).toHaveBeenCalledWith({
          ...mockBody,
          userId: mockAccessToken.sub,
        })

        expect(result).toEqual(expectedUseCaseResponse)
      })
    })

    describe('when there are errors', () => {
      it('should throw UnauthorizedException when use-case returns userDisabled error', async () => {
        const controller = buildController()

        mockedCreateActivityUseCase.execute.mockResolvedValue({
          success: false,
          error: CreateActivityApplicationError.userDisabled(),
        })

        await expect(controller.create(mockAccessToken, mockBody)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
      })

      it('should throw UnauthorizedException when use-case returns userNotFound error', async () => {
        const controller = buildController()

        mockedCreateActivityUseCase.execute.mockResolvedValue({
          success: false,
          error: CreateActivityApplicationError.userNotFound(),
        })

        await expect(controller.create(mockAccessToken, mockBody)).rejects.toThrow(
          new UnauthorizedException({
            code: UNAUTHORIZED_ACCESS,
            message: 'Unauthorized access',
          }),
        )
      })

      it('should throw UnprocessableEntityException when use-case returns sportNotFound error', async () => {
        const controller = buildController()
        const useCaseError = CreateActivityApplicationError.sportNotFound()

        mockedCreateActivityUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseError,
        })

        await expect(controller.create(mockAccessToken, mockBody)).rejects.toThrow(
          new UnprocessableEntityException({
            code: ACTIVITY_CREATE_ACTIVITY_SPORT_NOT_FOUND,
            message: useCaseError.message,
          }),
        )
      })

      it('should throw UnprocessableEntityException with payload when use-case returns invalidInput error', async () => {
        const controller = buildController()

        const expectedInputErrors = [
          CreateActivityInputError.unavailableError('some-field', 'capability'),
          CreateActivityInputError.validationError('another-field', 'Validation failed'),
        ]

        const useCaseError = CreateActivityApplicationError.invalidInput(expectedInputErrors)

        mockedCreateActivityUseCase.execute.mockResolvedValue({
          success: false,
          error: useCaseError,
        })

        await expect(controller.create(mockAccessToken, mockBody)).rejects.toThrow(
          new UnprocessableEntityException({
            code: ACTIVITY_CREATE_ACTIVITY_INVALID_INPUT,
            message: useCaseError.message,
            errors: useCaseError.errors,
          }),
        )
      })

      it('should throw InternalServerErrorException when use-case returns a unknown error id', async () => {
        const controller = buildController()
        const unknownUseCaseError = {
          id: 'some_unknown_error',
          message: 'Unknown error',
        } as unknown as CreateActivityApplicationError

        mockedCreateActivityUseCase.execute.mockResolvedValue({
          success: false,
          error: unknownUseCaseError,
        })

        await expect(controller.create(mockAccessToken, mockBody)).rejects.toThrow(
          new InternalServerErrorException(unknownUseCaseError),
        )
      })

      it('should throw error when use-case fails with an unexpected unhandled exception', async () => {
        const controller = buildController()
        const unexpectedError = new Error('Database connection lost')

        mockedCreateActivityUseCase.execute.mockImplementation(() => {
          throw unexpectedError
        })

        await expect(controller.create(mockAccessToken, mockBody)).rejects.toThrow(unexpectedError)
      })
    })
  })

  describe('getSports', () => {
    const expectedUseCaseResponse: GetSportsApplicationResponseDto = {
      sports: [
        {
          id: IdentifierMother.validString(),
          slug: 'football',
          imageUrl: null,
          config: { capabilities: {}, specs: {} },
        } as unknown as SportApplicationDto,
      ],
      count: 1,
    }

    describe('happy path', () => {
      beforeEach(() => {
        mockedGetSportsUseCase.execute.mockResolvedValue(expectedUseCaseResponse)
      })

      it('should call use-case correctly and return data', async () => {
        const controller = buildController()

        const result = await controller.getSports()

        expect(mockedGetSportsUseCase.execute).toHaveBeenCalledTimes(1)
        expect(result).toEqual(expectedUseCaseResponse)
      })
    })

    describe('when there are errors', () => {
      it('should throw error when use-case fails with an unexpected unhandled exception', async () => {
        const controller = buildController()
        const unexpectedError = new Error('Database connection lost')

        mockedGetSportsUseCase.execute.mockRejectedValue(unexpectedError)

        await expect(controller.getSports()).rejects.toThrow(unexpectedError)
      })
    })
  })
})
