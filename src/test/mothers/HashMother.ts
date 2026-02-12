import { randomBytes } from 'crypto'

export class HashMother {
  static valid(): string {
    return 'pXFhxrG0UilgU4eHWVUXdDAZhkInCSgjZeZDA3QWMBM='
  }

  static random(): string {
    return randomBytes(32).toString('base64')
  }
}
