export function compareExceptModifiedFields<T>(before: T, after: T, changed: (keyof T)[]) {
  const b: Partial<T> = { ...before }
  const a: Partial<T> = { ...after }

  for (const k of changed) {
    delete b[k]
    delete a[k]
  }

  expect(a).toEqual(b)
}
