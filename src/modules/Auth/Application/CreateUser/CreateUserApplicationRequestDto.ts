import { ClientMetadataApplicationResponse } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationResponse'

export interface CreateUserApplicationRequestDto {
  readonly email: string
  readonly token: string
  readonly username: string
  readonly name: string
  readonly password: string
  readonly requestedRole: string
  readonly clientMetadata: ClientMetadataApplicationResponse
}
