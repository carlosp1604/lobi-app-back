import { NodeIdGeneratorService } from '~/src/modules/Shared/Infrastructure/Services/NodeIdGeneratorService'

describe('NodeIdGeneratorService', () => {
  let service: NodeIdGeneratorService

  beforeEach(() => {
    service = new NodeIdGeneratorService()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  it('should call to crypto.randomUUID correctly', () => {
    const spy = jest.spyOn(global.crypto, 'randomUUID').mockReturnValue('89ecf14d-c5fa-4e9a-8965-3796eb4342ee')

    service.generateId()

    expect(spy).toHaveBeenCalled()
  })

  it('should return the correct data', () => {
    jest.spyOn(global.crypto, 'randomUUID').mockReturnValue('89ecf14d-c5fa-4e9a-8965-3796eb4342ee')

    const result = service.generateId()

    expect(result).toBe('89ecf14d-c5fa-4e9a-8965-3796eb4342ee')
  })
})
