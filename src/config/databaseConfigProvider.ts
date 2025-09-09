export class DatabaseConfigProvider {
  readonly host: string
  readonly port: number
  readonly database: string
  readonly username: string
  readonly password: string
  readonly logging: boolean

  constructor() {
    this.host = this.parseString('DATABASE_HOST')
    this.port = this.parseInteger('DATABASE_PORT', 5432)
    this.database = this.parseString('DATABASE_NAME')
    this.username = this.parseString('DATABASE_USER')
    this.password = this.parseString('DATABASE_PASSWORD')
    this.logging = (process.env.DATABASE_LOGGING ?? 'false') === 'true'
  }

  private parseString(key: string): string {
    const value = process.env[key]

    if (!value || value.trim() === '') {
      throw new Error(`[ENV] Missing required variable: ${key}`)
    }

    return value
  }

  private parseInteger(key: string, defaultValue?: number): number {
    const raw = process.env[key]

    if (!raw) {
      if (defaultValue !== undefined) {
        return defaultValue
      }

      throw new Error(`[ENV] Missing required number: ${key}`)
    }

    const num = parseInt(raw)

    if (Number.isNaN(num) || num < 0) {
      throw new Error(`[ENV] Invalid number for ${key}: "${raw}"`)
    }

    return num
  }
}
