import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'

export type AllowedType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'integer'

export type ObjectRuleConfig = { type: 'object'; schema: SchemaDefinition; optional?: boolean }
export type ArrayRuleConfig = { type: 'array'; items: SchemaRule; optional?: boolean }
export type PrimitiveRuleConfig = { type: AllowedType | AllowedType[]; optional?: boolean }

export type RuleConfig = ObjectRuleConfig | ArrayRuleConfig | PrimitiveRuleConfig

export type SchemaRule = AllowedType | AllowedType[] | RuleConfig

export type SchemaDefinition = {
  [key: string]: SchemaRule
}

export class TypeValidator {
  public static validate<T>(obj: unknown, schema: SchemaDefinition, path: string = ''): Result<T, string[]> {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return fail([`${path || 'Payload'} must be a valid object.`])
    }

    const errors: string[] = []

    this.validateObjectSchema(obj as Record<string, unknown>, schema, path, errors)

    if (errors.length > 0) {
      return fail(errors)
    }

    return success(obj as unknown as T)
  }

  private static validateObjectSchema(obj: Record<string, unknown>, schema: SchemaDefinition, path: string, errors: string[]): void {
    for (const key in schema) {
      const rule = schema[key]
      const currentPath = path ? `${path}.${key}` : key
      const value = obj[key]

      this.validateValue(value, rule, currentPath, errors)
    }
  }

  private static validateValue(value: unknown, rule: SchemaRule, path: string, errors: string[]): void {
    const isObjectConfig = typeof rule === 'object' && !Array.isArray(rule)
    const config = isObjectConfig ? rule : null

    const expectedTypesRaw = config ? config.type : rule
    const expectedTypes = Array.isArray(expectedTypesRaw) ? expectedTypesRaw : [expectedTypesRaw]
    const isOptional = config?.optional === true

    if (value === undefined || value === null) {
      if (!isOptional) {
        errors.push(`Missing required field: [${path}]`)
      }
      return
    }

    const isValidType = expectedTypes.some((type) => this.checkType(value, type as AllowedType))

    if (!isValidType) {
      const actualType = Array.isArray(value) ? 'array' : typeof value
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const expectedStr = expectedTypes.join(' | ')
      errors.push(`Invalid type at [${path}]. Expected: ${expectedStr}, Received: ${actualType}`)
      return
    }

    if (typeof value === 'object' && !Array.isArray(value) && value !== null && config && 'schema' in config) {
      this.validateObjectSchema(value as Record<string, unknown>, config.schema as SchemaDefinition, path, errors)
    }

    if (Array.isArray(value) && config && 'items' in config) {
      value.forEach((item, index) => {
        this.validateValue(item, config.items as SchemaRule, `${path}[${index}]`, errors)
      })
    }
  }

  private static checkType(value: unknown, expected: AllowedType): boolean {
    if (expected === 'array') {
      return Array.isArray(value)
    }

    if (expected === 'integer') {
      return typeof value === 'number' && Number.isInteger(value)
    }

    return typeof value === expected
  }
}
