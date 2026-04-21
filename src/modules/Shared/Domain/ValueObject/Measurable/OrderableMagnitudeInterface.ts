export interface OrderableMagnitudeInterface<T> {
  isGreaterThan(anotherMagnitude: T): boolean
  isEqual(anotherMagnitude: T): boolean
}
