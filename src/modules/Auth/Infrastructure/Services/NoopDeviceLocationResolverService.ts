import {
  DeviceLocation,
  DeviceLocationResolverServiceInterface,
} from '~/src/modules/Auth/Domain/DeviceLocationResolverServiceInterface'

// TODO: Implement
export class NoopDeviceLocationResolverService implements DeviceLocationResolverServiceInterface {
  /**
   * Resolves the device location for the given IP address
   * @param ip the IP address to resolve
   * @returns the resolved DeviceLocation, or null if not available
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public resolve(ip: string): Promise<DeviceLocation | null> {
    return Promise.resolve(null)
  }
}
