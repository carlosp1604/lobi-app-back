export interface OrderableMagnitudeInterface<T> {
  readonly unit: string

  isGreaterThan(anotherMagnitude: T): boolean
  isEqual(anotherMagnitude: T): boolean
}
