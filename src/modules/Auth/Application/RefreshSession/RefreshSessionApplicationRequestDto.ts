import { ClientMetadataApplicationResponse } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationResponse'

export interface RefreshSessionApplicationRequestDto {
  token: string
  clientMetadata: ClientMetadataApplicationResponse
}
