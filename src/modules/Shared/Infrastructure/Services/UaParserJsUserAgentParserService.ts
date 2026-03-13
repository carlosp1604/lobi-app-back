import { UAParser } from 'ua-parser-js'
import { ParsedUserAgent } from '~/src/modules/Shared/Infrastructure/Services/ParsedUserAgent'
import { UserAgentParserServiceInterface } from '~/src/modules/Shared/Infrastructure/Services/UserAgentParserServiceInterface'

export class UaParserJsUserAgentParserService implements UserAgentParserServiceInterface {
  /**
   * Parses a raw User-Agent string into a structured object
   * @param userAgent the raw User-Agent string to parse
   * @returns a structured object with the parsed details
   */
  public parse(userAgent: string): ParsedUserAgent {
    const parser = new UAParser(userAgent)
    const result = parser.getResult()

    return {
      raw: userAgent,
      browser: {
        name: result.browser.name || null,
        version: result.browser.version || null,
      },
      os: {
        name: result.os.name || null,
        version: result.os.version || null,
      },
      device: {
        type: result.device.type || null,
        vendor: result.device.vendor || null,
        model: result.device.model || null,
      },
    }
  }
}
