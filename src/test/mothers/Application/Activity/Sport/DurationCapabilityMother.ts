import { DurationCapabilityRawData } from '~/src/modules/Activity/Application/Sport/Capabilities/DurationCapability'

export class DurationCapabilityMother {
  public static validData(): DurationCapabilityRawData {
    return {
      start: 60,
      end: 120,
    }
  }

  public static invalidData(): DurationCapabilityRawData {
    return {
      start: 120,
      end: 60,
    }
  }

  public static invalidStructure(): { value: number } {
    return {
      value: 60,
    }
  }
}
