/* eslint @typescript-eslint/unbound-method: 0 */
import { GetSports } from '~/src/modules/Activity/Application/GetSports/GetSports'
import { mock, mockReset } from 'jest-mock-extended'
import { IdentifierMother } from '~/src/test/mothers/Domain/Shared/IdentifierMother'
import { SportTestBuilder } from '~/src/test/modules/Activity/Domain/Sport/SportTestBuilder'
import { SportRepositoryInterface } from '~/src/modules/Activity/Domain/Sport/SportRepositoryInterface'

describe('GetSports', () => {
  const mockedSportRepository = mock<SportRepositoryInterface>()

  beforeEach(() => {
    mockReset(mockedSportRepository)
  })

  const buildUseCase = () => {
    return new GetSports(mockedSportRepository)
  }

  describe('happy path', () => {
    it('should call repository correctly and return data', async () => {
      const sportId = IdentifierMother.valid()
      const sport = new SportTestBuilder().withId(sportId).build()

      mockedSportRepository.getAll.mockResolvedValue({
        sports: [sport],
        count: 1,
      })

      const useCase = buildUseCase()

      const result = await useCase.execute()

      expect(mockedSportRepository.getAll).toHaveBeenCalledTimes(1)
      expect(result.count).toBe(1)
      expect(result.sports.length).toBe(1)
      expect(result.sports[0].id).toBe(sportId.value)
    })
  })

  describe('when there are errors', () => {
    it('should throw error when repository fails', async () => {
      const unexpectedError = new Error('Database connection lost')

      mockedSportRepository.getAll.mockRejectedValue(unexpectedError)

      const useCase = buildUseCase()
      await expect(useCase.execute()).rejects.toThrow(unexpectedError)

      expect(mockedSportRepository.getAll).toHaveBeenCalledTimes(1)
    })
  })
})
