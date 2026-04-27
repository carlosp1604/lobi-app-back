import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { SerializableInterface } from '~/src/modules/Shared/Domain/SerializableInterface'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'

export class ActivityDescription extends ValueObject<string> implements SerializableInterface<string> {
  private __activityDescription: void

  public static readonly MIN_LENGTH = 1
  public static readonly MAX_LENGTH = 2000

  public static readonly REGEX = new RegExp(`^[\\s\\S]{${ActivityDescription.MIN_LENGTH},${ActivityDescription.MAX_LENGTH}}$`)

  private constructor(value: string) {
    super(value)
  }

  static fromString(value: string): ActivityDescription {
    const result = this.safeCreate(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  static safeCreate(value: string): Result<ActivityDescription, ActivityDomainException> {
    const normalized = value.trim()

    if (!ActivityDescription.isValid(normalized)) {
      return fail(ActivityDomainException.invalidActivityDescription(value, this.MIN_LENGTH, this.MAX_LENGTH))
    }

    return success(new ActivityDescription(normalized))
  }

  private static isValid(value: string): boolean {
    return this.REGEX.test(value)
  }

  public toPrimitives(): string {
    return this._value
  }
}
