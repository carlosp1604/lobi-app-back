import { Pace } from '~/src/modules/Shared/Domain/ValueObject/Pace'
import { TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import {
  CapabilityDTO,
  SportBaseCapability,
  SportCapabilityRawDataValidationError,
} from '~/src/modules/Activity/Domain/Sport/SportRegistry/Capabilities/SportBaseCapability'

export type PaceCapabilityRawData = {
  value: number
  unit: string
}

export class PaceCapability extends SportBaseCapability<Pace, PaceCapabilityRawData> {
  public readonly capabilityName = 'pace'

  protected validateData(data: unknown): Result<PaceCapabilityRawData, SportCapabilityRawDataValidationError> {
    const typeCheck = TypeValidator.validate<PaceCapabilityRawData>(data, { value: 'number', unit: 'string' })

    if (!typeCheck.success) {
      return fail({ errors: typeCheck.error })
    }

    return success(typeCheck.value)
  }

  protected performValidation(data: PaceCapabilityRawData): Result<Pace, SportDomainException> {
    const paceResult = Pace.safeCreate(data)

    if (!paceResult.success) {
      return fail(SportDomainException.capabilityValidationFailed(this.capabilityName, paceResult.error.message))
    }

    return success(paceResult.value)
  }

  public toDTO(): CapabilityDTO {
    return {
      name: this.capabilityName,
      data: {
        ...Pace.getConfiguration(),
      },
    }
  }
}
