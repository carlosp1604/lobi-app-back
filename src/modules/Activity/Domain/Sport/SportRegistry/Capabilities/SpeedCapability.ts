import {
  CapabilityDTO,
  SportBaseCapability,
  SportCapabilityRawDataValidationError,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SportBaseCapability'
import { Speed } from '~/src/modules/Shared/Domain/ValueObject/Speed'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'

export type SpeedCapabilityRawData = {
  value: number
  unit: string
}

export class SpeedCapability extends SportBaseCapability<Speed, SpeedCapabilityRawData> {
  public readonly capabilityName = 'speed'

  protected validateData(data: unknown): Result<SpeedCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<SpeedCapabilityRawData>(data, { value: 'number', unit: 'string' })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    return success(typeCheck.value)
  }

  protected performValidation(data: SpeedCapabilityRawData): Result<Speed, SportDomainException> {
    const speedResult = Speed.safeCreate(data)

    if (!speedResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, speedResult.error.message))
    }

    return success(speedResult.value)
  }

  public toDTO(): CapabilityDTO {
    return {
      name: this.capabilityName,
      data: {
        ...Speed.getConfiguration(),
      },
    }
  }
}
