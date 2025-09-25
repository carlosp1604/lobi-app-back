import { NodeClockService } from '~/src/modules/Shared/Infrastructure/Services/NodeClockService'

describe('NodeClockService', () => {
  let service: NodeClockService

  beforeEach(() => {
    service = new NodeClockService()
  })

  it('should return a Date object', () => {
    const result = service.now()
    expect(result).toBeInstanceOf(Date)
  })

  it('should return the current date (approx)', () => {
    const before = Date.now()
    const result = service.now()
    const after = Date.now()

    expect(result.getTime()).toBeGreaterThanOrEqual(before)
    expect(result.getTime()).toBeLessThanOrEqual(after)
  })
})
