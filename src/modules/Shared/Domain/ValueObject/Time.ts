import { ValueObject } from '~/src/modules/Shared/Domain/ValueObject/ValueObject'
import { SharedDomainException } from '~/src/modules/Shared/Domain/SharedDomainException'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'

export class Time extends ValueObject<number> {
  private __timeBrand: void

  public static readonly REGEX = /^(?:([0-9]+):)?([0-5][0-9]):([0-5][0-9])$/

  private constructor(value: number) {
    super(value)
  }

  public static safeCreateFromString(value: string): Result<Time, SharedDomainException> {
    const timeValue = value.trim()
    const match = timeValue.match(this.REGEX)

    if (!match) {
      return fail(SharedDomainException.invalidTime(timeValue))
    }

    const hours = match[1] ? parseInt(match[1], 10) : 0
    const minutes = parseInt(match[2], 10)
    const seconds = parseInt(match[3], 10)

    const totalSeconds = hours * 3600 + minutes * 60 + seconds

    if (totalSeconds <= 0) {
      return fail(SharedDomainException.invalidTime(timeValue))
    }

    return success(new Time(totalSeconds))
  }

  public static fromString(value: string): Time {
    const result = this.safeCreateFromString(value)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public static safeCreateFromSeconds(seconds: number): Result<Time, SharedDomainException> {
    if (isNaN(seconds) || seconds <= 0) {
      return fail(SharedDomainException.invalidTime(String(seconds)))
    }

    return success(new Time(seconds))
  }

  public static fromSeconds(seconds: number): Time {
    const result = this.safeCreateFromSeconds(seconds)

    if (!result.success) {
      throw result.error
    }

    return result.value
  }

  public toString(): string {
    return Time.formatFromSeconds(this._value)
  }

  public toDTO() {
    return {
      seconds: this._value,
      formatted: Time.formatFromSeconds(this._value),
    }
  }

  private static formatFromSeconds(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const minutesWithPadding = minutes.toString().padStart(2, '0')
    const secondsWithPadding = seconds.toString().padStart(2, '0')

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutesWithPadding}:${secondsWithPadding}`
    }

    return `${minutesWithPadding}:${secondsWithPadding}`
  }
}
