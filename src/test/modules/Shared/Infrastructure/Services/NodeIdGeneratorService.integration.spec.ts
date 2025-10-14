import { NodeIdGeneratorService } from '~/src/modules/Shared/Infrastructure/Services/NodeIdGeneratorService'

describe('NodeIdGeneratorService', () => {
  let service: NodeIdGeneratorService

  beforeEach(() => {
    service = new NodeIdGeneratorService()
  })

  it('should return a valid UUID v4', () => {
    const result = service.generateId()
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    expect(result).toMatch(uuidV4Regex)
  })

  it('should generate unique identifiers', () => {
    const results = new Set(Array.from({ length: 100 }, () => service.generateId()))
    expect(results.size).toBe(100)
  })
})
