import { FastifyRequest } from 'fastify'
import { ClientMetadataExtractorInterface } from '~/src/modules/Shared/Infrastructure/Services/ClientMetadataExtractorInterface'
import { RawClientMetadataDto } from '~/src/modules/Shared/Infrastructure/Services/RawClientMetadataDto'

export class FastifyClientMetadataExtractor implements ClientMetadataExtractorInterface<FastifyRequest> {
  /**
   * Extracts raw client metadata from the incoming HTTP request.
   * @param request - The raw HTTP request object provided by the underlying framework
   * @returns A Data Transfer Object containing the unparsed, raw client origin data.
   */
  public extract(request: FastifyRequest): RawClientMetadataDto {
    return {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    }
  }
}
