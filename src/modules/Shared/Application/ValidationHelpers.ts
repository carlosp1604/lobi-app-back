export function expectAllKeys<T>() {
  return function <K extends Array<keyof T>>(...keys: K & (keyof T extends K[number] ? K : never)) {
    return keys
  }
}
