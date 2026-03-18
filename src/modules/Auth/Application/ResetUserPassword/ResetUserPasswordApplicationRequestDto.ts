import { ClientMetadataApplicationResponse } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationResponse'

export class ResetUserPasswordApplicationRequestDto {
  readonly email: string
  readonly token: string
  readonly password: string
  readonly clientMetadata: ClientMetadataApplicationResponse
}
