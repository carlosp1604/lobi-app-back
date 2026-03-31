import { expect } from '@jest/globals'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/

export const expectIsoDate = expect.stringMatching(ISO_DATE_REGEX)

export const expectStringOrNull = {
  asymmetricMatch: (val: unknown) => val === null || typeof val === 'string',
  jasmineToString: () => 'String | null',
}
