import fc from 'fast-check'
import { checkProperty } from '~/src/test/utils/fast-check-helper'

const sum = (a: number, b: number) => {
  return a + b
}

checkProperty(
  'sum(a, b) should be commutative',
  fc.property(fc.integer(), fc.integer(), (a, b) => {
    return sum(a, b) === sum(b, a)
  }),
)
