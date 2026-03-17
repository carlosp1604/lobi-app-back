import { randomBytes } from 'crypto'

export class RefreshTokenMother {
  static valid(): string {
    return 'pXFhxrG0UilgU4eHWVUXdDAZhkInCSgjZeZDA3QWMBM='
  }

  static random(): string {
    return randomBytes(32).toString('base64')
  }

  static invalidFormat(): string {
    return '*'.repeat(48)
  }

  static tooLong(): string {
    return 'a'.repeat(120)
  }

  static tooShort(): string {
    return 'invalid-insufficient-length'
  }
}
