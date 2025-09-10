import fc from 'fast-check'

export function checkProperty(label: string, property: fc.IProperty<any>) {
  test(label, () => {
    fc.assert(property, { verbose: true })
  })
}
