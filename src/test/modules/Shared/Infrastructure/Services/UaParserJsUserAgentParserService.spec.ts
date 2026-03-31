import { UAParser } from 'ua-parser-js'
import { UserAgentParserServiceInterface } from '~/src/modules/Shared/Infrastructure/Services/UserAgentParserServiceInterface'
import { UaParserJsUserAgentParserService } from '~/src/modules/Shared/Infrastructure/Services/UaParserJsUserAgentParserService'

jest.mock('ua-parser-js')

describe('UaParserJsUserAgentParserService', () => {
  let service: UserAgentParserServiceInterface
  let mockGetResult: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    service = new UaParserJsUserAgentParserService()
    mockGetResult = jest.fn()
    ;(UAParser as unknown as jest.Mock).mockImplementation(() => ({
      getResult: mockGetResult,
    }))
  })

  it('should call service and map data correctly', () => {
    mockGetResult.mockReturnValue({
      browser: { name: 'Chrome', version: '120' },
      os: { name: 'Windows', version: '10' },
      device: { type: 'mobile', vendor: 'Apple', model: 'iPhone' },
    })

    const result = service.parse('valid-ua')

    expect(result).toEqual({
      raw: 'valid-ua',
      browser: { name: 'Chrome', version: '120' },
      os: { name: 'Windows', version: '10' },
      hardware: { type: 'mobile', vendor: 'Apple', model: 'iPhone' },
    })
    expect(UAParser).toHaveBeenCalledWith('valid-ua')
  })

  it('should map undefined values to null', () => {
    mockGetResult.mockReturnValue({
      browser: {},
      os: {},
      device: {},
    })

    const result = service.parse('any-string')

    expect(result).toEqual({
      raw: 'any-string',
      browser: { name: null, version: null },
      os: { name: null, version: null },
      hardware: { type: null, vendor: null, model: null },
    })
    expect(UAParser).toHaveBeenCalledWith('any-string')
  })
})
