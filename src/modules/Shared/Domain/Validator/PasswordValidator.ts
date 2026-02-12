import { Validator } from '~/src/modules/Shared/Domain/Validator/Validator'

export class PasswordValidator implements Validator<string> {
  private minLength: number = 8
  private maxLength: number = 128
  private format = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/

  public isValid(value: string): boolean {
    if (value.length < this.minLength) {
      return false
    }

    if (value.length > this.maxLength) {
      return false
    }

    return this.format.test(value)
  }
}
