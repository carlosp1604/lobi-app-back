import { LocationCapabilityRawData } from '~/src/modules/Activity/Application/Sport/Capabilities/LocationCapability'

export class LocationCapabilityMother {
  static validData(): LocationCapabilityRawData {
    return {
      lat: '-0.0102496',
      lng: '-78.4464668',
    }
  }

  static invalidData(): LocationCapabilityRawData {
    return {
      lat: '91.0001',
      lng: '181.0001',
    }
  }

  static invalidStructure(): { degrees: number; minutes: number; seconds: number } {
    return {
      degrees: 78,
      minutes: 27,
      seconds: 21,
    }
  }
}
