import { DeviceInfo } from '~/src/modules/Auth/Domain/ValueObject/DeviceInfo'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { DeviceInfoMother } from '~/src/test/mothers/DeviceInfoMother'
import { ClientMetadataApplicationResponse } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationResponse'

export class ClientMetadataResponseTestBuilder {
  private _deviceInfo = DeviceInfoMother.valid()
  private _deviceLocation: DeviceLocation | null = null
  private _userIpHash: UserIpHash | null = null

  public withDeviceInfo(deviceInfo: DeviceInfo): this {
    this._deviceInfo = deviceInfo
    return this
  }

  public withDeviceLocation(deviceLocation: DeviceLocation | null): this {
    this._deviceLocation = deviceLocation
    return this
  }

  public withUserIpHash(userIpHash: UserIpHash | null): this {
    this._userIpHash = userIpHash
    return this
  }

  public build(): ClientMetadataApplicationResponse {
    return {
      deviceInfo: this._deviceInfo,
      deviceLocation: this._deviceLocation,
      userIpHash: this._userIpHash,
    }
  }
}
