export abstract class ValueObject<T> {
  protected readonly _value: T

  constructor(value: T) {
    this._value = value
  }

  get value(): T {
    return this._value
  }

  public equals(vo?: ValueObject<T> | null): boolean {
    if (vo === null || vo === undefined) {
      return false
    }

    if (vo.constructor !== this.constructor) {
      return false
    }

    return this.value === vo.value
  }

  toString(): string {
    return String(this._value)
  }
}
