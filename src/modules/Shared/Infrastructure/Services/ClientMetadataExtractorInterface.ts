import { RawClientMetadataDto } from './RawClientMetadataDto'

export interface ClientMetadataExtractorInterface<TRequest = any> {
  /**
   * Extracts raw client metadata from the incoming HTTP request.
   * @param request - The raw HTTP request object provided by the underlying framework
   * @returns A Data Transfer Object containing the unparsed, raw client origin data.
   */
  extract(request: TRequest): RawClientMetadataDto
}
