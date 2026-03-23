import { ClientMetadataApplicationResponse } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationResponse'

export interface CloseUserSessionApplicationRequestDto {
  readonly userId: string
  readonly sessionId: string
  readonly currentSessionId: string
  readonly clientMetadata: ClientMetadataApplicationResponse
}
