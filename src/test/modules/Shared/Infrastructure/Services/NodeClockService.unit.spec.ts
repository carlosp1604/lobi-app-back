import { NodeClockService } from '~/src/modules/Shared/Infrastructure/Services/NodeClockService'

describe('NodeClockService', () => {
  const fake = new Date('2025-09-24T10:27:25Z')

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useFakeTimers().setSystemTime(fake)
  })

  it('should call to Date correctly', () => {
    const spy = jest.spyOn(global, 'Date').mockImplementation(() => fake as any)

    const service = new NodeClockService()
    const result = service.now()

    expect(spy).toHaveBeenCalled()
    expect(result).toBe(fake)
  })
})
