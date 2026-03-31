import { ParsedUserAgent } from '~/src/modules/Shared/Infrastructure/Services/ParsedUserAgent'

export interface UserAgentParserServiceInterface {
  /**
   * Parses a raw User-Agent string into a structured object
   * @param userAgent the raw User-Agent string to parse
   * @returns a structured object with the parsed details
   */
  parse(userAgent: string): ParsedUserAgent
}
