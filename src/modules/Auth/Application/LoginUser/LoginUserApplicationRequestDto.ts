import { ClientMetadataApplicationResponse } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationResponse'

export interface LoginUserApplicationRequestDto {
  password: string
  email: string
  clientMetadata: ClientMetadataApplicationResponse
}
