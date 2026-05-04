import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'

export class ActivityTitle extends ValueObject<string> implements SerializableInterface<string> {
  private __activityTitleBrand: void

  public static readonly MIN_LENGTH = 4
  public static readonly MAX_LENGTH = 100
  public static readonly REGEX = new RegExp(`^.{${ActivityTitle.MIN_LENGTH},${ActivityTitle.MAX_LENGTH}}$`)

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): ActivityTitle {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<ActivityTitle, ActivityDomainException> {
    const normalized = value.replace(/\s+/g, ' ').trim()

    if (!ActivityTitle.isValid(normalized)) {
      return fail(ActivityDomainException.invalidActivityTitle(value, this.MIN_LENGTH, this.MAX_LENGTH))
    }

    return success(new ActivityTitle(normalized))
  }

  private static isValid(value: string): boolean {
    return this.REGEX.test(value)
  }

  public toPrimitives(): string {
    return this._value
  }
}
