// Solution extracted from: https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Math/round
export class NumberPrecision {
  public static readonly DEFAULT_DECIMALS = 8

  private static adjust(type: 'round' | 'floor', value: number, decimals: number): number {
    if (isNaN(value) || !isFinite(value)) {
      return 0
    }

    const safeDecimals = Math.max(0, decimals)

    if (safeDecimals === 0) {
      return Math[type](value)
    }

    let parts = value.toString().split('e')

    let shiftedBase = Number(parts[0] + 'e' + (parts[1] ? Number(parts[1]) + safeDecimals : safeDecimals))

    if (type === 'floor') {
      shiftedBase += Number.EPSILON
    }

    const operated = Math[type](shiftedBase)

    parts = operated.toString().split('e')
    return Number(parts[0] + 'e' + (parts[1] ? Number(parts[1]) - safeDecimals : -safeDecimals))
  }

  public static round(value: number, decimals: number = this.DEFAULT_DECIMALS): number {
    return this.adjust('round', value, decimals)
  }

  public static format(value: number, decimals: number = this.DEFAULT_DECIMALS): number {
    return this.adjust('floor', value, decimals)
  }

  public static equals(valueA: number, valueB: number, decimals: number = this.DEFAULT_DECIMALS): boolean {
    if (isNaN(valueA) || isNaN(valueB)) {
      return false
    }

    if (!isFinite(valueA) || !isFinite(valueB)) {
      return false
    }

    if (valueA === valueB) {
      return true
    }

    const safeDecimals = Math.max(0, decimals)

    const mathTolerance = Math.pow(10, -safeDecimals) / 2

    const floatDriftTolerance = 1.5e-8

    const tolerance = Math.max(mathTolerance, floatDriftTolerance)

    const difference = Math.abs(valueA - valueB)

    return difference < tolerance
  }
}
