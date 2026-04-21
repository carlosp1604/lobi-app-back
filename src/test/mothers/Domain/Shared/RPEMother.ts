import { RPE, ValidRPEValue } from '~/src/modules/Shared/Domain/ValueObject/Measurable/RPE'

export class RPEMother {
  public static readonly INVALID_VALUES = ['11', 'moderate', 'high-intensity', '0', '-10']
  public static readonly VALID_VALUES: Array<ValidRPEValue> = Object.values(ValidRPEValue)

  public static valid(): RPE {
    return RPE.fromString(ValidRPEValue.FIVE)
  }

  public static randomValue(): string {
    return this.VALID_VALUES[Math.floor(Math.random() * this.VALID_VALUES.length)]
  }

  public static random(): RPE {
    return RPE.fromString(this.randomValue())
  }
}
