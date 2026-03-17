import { ClientMetadataApplicationResponse } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationResponse'

export interface GenerateVerificationTokenApplicationRequestDto {
  readonly email: string
  readonly purpose: string
  readonly sendNewToken: boolean
  readonly clientMetadata: ClientMetadataApplicationResponse
}
