import { fail, Result } from '~/src/modules/Shared/Domain/Result'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'

export interface SpecSchema {
  name: string
  definition: Record<string, unknown>
}

export interface SportSpecRawDataValidationError {
  errors: Array<string>
}

export abstract class SportBaseSpec<T, P> {
  public abstract readonly specName: string

  protected abstract validateData(data: unknown): Result<P, SportSpecRawDataValidationError>

  protected abstract performValidation(data: P): Result<T, SportDomainException>

  public abstract getSchema(): SpecSchema

  public abstract translate(data: T): unknown

  public validate(data: unknown): Result<T, SportDomainException> {
    const validateDataResult = this.validateData(data)

    if (!validateDataResult.success) {
      return fail(SportDomainException.invalidSpecData(this.specName, validateDataResult.error.errors))
    }

    const validatedData = validateDataResult.value

    return this.performValidation(validatedData)
  }
}
