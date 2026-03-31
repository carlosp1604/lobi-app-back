import { FastifyRequest } from 'fastify'
import { RequestMetadataExtractorInterface } from '~/src/modules/Shared/Infrastructure/Services/RequestMetadataExtractorInterface'
import { RawRequestMetadataDto } from '~/src/modules/Shared/Infrastructure/Services/RawRequestMetadataDto'

export class FastifyClientMetadataExtractor implements RequestMetadataExtractorInterface<FastifyRequest> {
  /**
   * Extracts raw request metadata from the incoming HTTP request.
   * @param request - The raw HTTP request object provided by the underlying framework
   * @returns A Data Transfer Object containing the unparsed, raw client origin data.
   */
  public extract(request: FastifyRequest): RawRequestMetadataDto {
    return {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    }
  }
}
