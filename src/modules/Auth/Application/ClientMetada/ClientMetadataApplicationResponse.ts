import { DeviceInfo } from '~/src/modules/Auth/Domain/ValueObject/DeviceInfo'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'

export interface ClientMetadataApplicationResponse {
  deviceInfo: DeviceInfo
  deviceLocation: DeviceLocation | null
  userIpHash: UserIpHash | null
}
