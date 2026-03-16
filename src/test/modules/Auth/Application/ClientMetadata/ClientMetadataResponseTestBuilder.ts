import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UserIpHash } from '~/src/modules/Shared/Domain/ValueObject/UserIpHash'
import { UserAgentMother } from '~/src/test/mothers/UserAgentMother'
import { ClientMetadataApplicationResponse } from '~/src/modules/Auth/Application/ClientMetada/ClientMetadataApplicationResponse'

export class ClientMetadataResponseTestBuilder {
  private _userAgent = UserAgentMother.valid()
  private _deviceLocation: DeviceLocation | null = null
  private _userIpHash: UserIpHash | null = null

  public withUserAgent(userAgent: UserAgent): this {
    this._userAgent = userAgent
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
      userAgent: this._userAgent,
      deviceLocation: this._deviceLocation,
      userIpHash: this._userIpHash,
    }
  }
}
