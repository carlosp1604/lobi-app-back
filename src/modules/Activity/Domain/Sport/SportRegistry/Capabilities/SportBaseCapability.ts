import { Result } from '~/src/modules/Shared/Domain/Result'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'

export interface CapabilityDTO {
  name: string
  data: Record<string, unknown>
}

export interface SportCapabilityRawDataValidationError {
  errors: Array<string>
}

export abstract class SportBaseCapability<T, P> {
  public abstract readonly capabilityName: string

  protected abstract validateData(data: unknown): Result<P, SportCapabilityRawDataValidationError>

  protected abstract performValidation(data: P): Result<T, SportDomainException>

  public abstract toDTO(): CapabilityDTO

  public validate(data: unknown): Result<T, SportDomainException> {
    const validateDataResult = this.validateData(data)

    if (!validateDataResult.success) {
      return fail(SportDomainException.invalidCapabilityData(this.capabilityName, validateDataResult.error.errors))
    }

    const validatedData = validateDataResult.value

    return this.performValidation(validatedData)
  }
}
