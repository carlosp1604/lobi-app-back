export interface DeviceLocation {
  country: string
  city: string
  timezone: string
}

export interface DeviceLocationServiceInterface {
  /**
   * Resolves the device location for the given IP address
   * @param ip the IP address to resolve
   * @returns the resolved DeviceLocation, or null if not available
   */
  resolve(ip: string): Promise<DeviceLocation | null>
}
