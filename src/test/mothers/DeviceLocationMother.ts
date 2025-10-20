import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'

export class DeviceLocationMother {
  static valid(): DeviceLocation {
    return DeviceLocation.fromProps({ countryCode: 'ES', city: 'Murcia' })
  }

  static random(): DeviceLocation {
    const cities = ['London', 'Paris', 'Tokyo', 'Berlin', 'Rome']
    const codes = ['GB', 'FR', 'JP', 'DE', 'IT']

    const index = Math.floor(Math.random() * cities.length)

    return DeviceLocation.fromProps({
      city: cities[index],
      countryCode: codes[index],
    })
  }
}
