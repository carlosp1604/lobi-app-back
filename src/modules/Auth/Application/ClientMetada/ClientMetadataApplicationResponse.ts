import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'

export interface ClientMetadataApplicationResponse {
  userAgent: UserAgent
  deviceLocation: DeviceLocation | null
  userIpHash: UserIpHash | null
}
