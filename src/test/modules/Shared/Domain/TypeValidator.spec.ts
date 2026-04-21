import { SchemaDefinition, TypeValidator } from '~/src/modules/Shared/Domain/TypeValidator'

describe('TypeValidator', () => {
  it('should return fail when the payload is null', () => {
    const result = TypeValidator.validate(null, { name: 'string' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toEqual(['Payload must be a valid object.'])
    }
  })

  it('should return fail when the payload is not an object', () => {
    const result = TypeValidator.validate('not-an-object', { name: 'string' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toEqual(['Payload must be a valid object.'])
    }
  })

  describe('primitive types validation', () => {
    it('should validate primitive types correctly', () => {
      const schema: SchemaDefinition = {
        name: 'string',
        weight: 'number',
        isActive: 'boolean',
      }

      const payload = { name: 'John', weight: 87.5, isActive: true }
      const result = TypeValidator.validate(payload, schema)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual(payload)
      }
    })

    describe('integer', () => {
      it('should validate integer value correctly', () => {
        const schema: SchemaDefinition = { age: 'integer' }

        const payload = { age: 30 }
        const result = TypeValidator.validate(payload, schema)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.value).toEqual(payload)
        }
      })

      it('should return fail when expects an integer but a float number is given', () => {
        const schema: SchemaDefinition = { age: 'integer' }

        const payload = { age: 30.7 }
        const result = TypeValidator.validate(payload, schema)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toEqual(['Invalid type at [age]. Expected: integer, Received: number'])
        }
      })
    })

    it('should return fail when a required field is missing', () => {
      const result = TypeValidator.validate({ name: 'John' }, { name: 'string', age: 'number' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toEqual(['Missing required field: [age]'])
      }
    })

    it('should return fail when a field has an incorrect type', () => {
      const result = TypeValidator.validate({ age: 'not-an-age' }, { age: 'number' })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toEqual(['Invalid type at [age]. Expected: number, Received: string'])
      }
    })

    it('should handle optional fields correctly', () => {
      const schema: SchemaDefinition = {
        name: 'string',
        nickname: { type: 'string', optional: true },
      }

      const result1 = TypeValidator.validate({ name: 'John' }, schema)
      expect(result1.success).toBe(true)

      const result2 = TypeValidator.validate({ name: 'John', nickname: 'john_30' }, schema)
      expect(result2.success).toBe(true)
    })
  })

  describe('union types validation', () => {
    const schema: SchemaDefinition = { value: ['string', 'number'] }

    it('should return success when field type matches an allowed type (first type)', () => {
      const result = TypeValidator.validate({ value: '01:30' }, schema)
      expect(result.success).toBe(true)
    })

    it('should return success when field type matches an allowed type (second type)', () => {
      const result = TypeValidator.validate({ value: 90 }, schema)
      expect(result.success).toBe(true)
    })

    it('should return fail when field type does not match any allowed types', () => {
      const result = TypeValidator.validate({ value: true }, schema)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toEqual(['Invalid type at [value]. Expected: string | number, Received: boolean'])
      }
    })
  })

  describe('nested objects validation', () => {
    const schema: SchemaDefinition = {
      config: {
        type: 'object',
        schema: {
          teams: 'number',
          allowMultiTeam: { type: 'boolean', optional: true },
        },
      },
    }

    it('should validate a nested object correctly', () => {
      const payload = { config: { teams: 2, allowMultiTeam: false } }
      const result = TypeValidator.validate(payload, schema)
      expect(result.success).toBe(true)
    })

    it('should return fail when a field is missing in the nested object', () => {
      const payload = { config: { allowMultiTeam: false } } // Missing 'teams'
      const result = TypeValidator.validate(payload, schema)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toEqual(['Missing required field: [config.teams]'])
      }
    })

    it('should return fail when a field has an invalid type in the nested object', () => {
      const payload = { config: { teams: 'two' } }
      const result = TypeValidator.validate(payload, schema)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toEqual(['Invalid type at [config.teams]. Expected: number, Received: string'])
      }
    })
  })

  describe('arrays validation', () => {
    it('should validate an array of primitive types correctly', () => {
      const schema: SchemaDefinition = {
        tags: { type: 'array', items: 'string' },
      }

      const result = TypeValidator.validate({ tags: ['rookie', 'amateur', 'pro'] }, schema)
      expect(result.success).toBe(true)
    })

    it('should return fail when an array item has an invalid type', () => {
      const schema: SchemaDefinition = {
        tags: { type: 'array', items: 'string' },
      }

      const result = TypeValidator.validate({ tags: ['rookie', 99] }, schema)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toEqual(['Invalid type at [tags[1]]. Expected: string, Received: number'])
      }
    })

    it('should validate an array of nested objects', () => {
      const schema: SchemaDefinition = {
        sets: {
          type: 'array',
          items: {
            type: 'object',
            schema: {
              homeScore: 'number',
              awayScore: 'number',
            },
          },
        },
      }

      const validPayload = {
        sets: [
          { homeScore: 6, awayScore: 4 },
          { homeScore: 7, awayScore: 5 },
        ],
      }
      expect(TypeValidator.validate(validPayload, schema).success).toBe(true)

      const invalidPayload = {
        sets: [
          { homeScore: 6, awayScore: 4 },
          { homeScore: 'seven', awayScore: 5 },
        ],
      }
      const result = TypeValidator.validate(invalidPayload, schema)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toEqual(['Invalid type at [sets[1].homeScore]. Expected: number, Received: string'])
      }
    })

    it('should validate an array of arrays correctly', () => {
      const schema: SchemaDefinition = {
        matrix: {
          type: 'array',
          items: {
            type: 'array',
            items: 'number',
          },
        },
      }

      const validPayload = {
        matrix: [
          [1, 2],
          [3, 4],
        ],
      }
      expect(TypeValidator.validate(validPayload, schema).success).toBe(true)

      const invalidPayload = {
        matrix: [
          [1, 2],
          [3, 'cuatro'],
        ],
      }
      const result = TypeValidator.validate(invalidPayload, schema)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toEqual(['Invalid type at [matrix[1][1]]. Expected: number, Received: string'])
      }
    })
  })

  describe('error accumulation', () => {
    it('should return all validation errors at once', () => {
      const schema: SchemaDefinition = {
        name: 'string',
        age: 'number',
        tags: { type: 'array', items: 'string' },
        stats: {
          type: 'object',
          schema: {
            level: 'number',
            achievements: { type: 'array', items: { type: 'object', schema: { name: 'string', rank: 'number' } } },
          },
        },
      }

      const payload = {
        age: 'thirty',
        tags: ['one', 2, false],
        stats: {
          level: true,
          achievements: [
            { name: 'an-achievement', rank: 10 },
            { name: 'another-achievement', rank: [1] },
            'an-achievement-that-not-suits-array-type',
          ],
        },
      }

      const result = TypeValidator.validate(payload, schema, 'fieldName')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.length).toBe(7)
        expect(result.error).toContain('Missing required field: [fieldName.name]')
        expect(result.error).toContain('Invalid type at [fieldName.age]. Expected: number, Received: string')
        expect(result.error).toContain('Invalid type at [fieldName.tags[1]]. Expected: string, Received: number')
        expect(result.error).toContain('Invalid type at [fieldName.tags[2]]. Expected: string, Received: boolean')
        expect(result.error).toContain('Invalid type at [fieldName.stats.level]. Expected: number, Received: boolean')
        expect(result.error).toContain('Invalid type at [fieldName.stats.achievements[1].rank]. Expected: number, Received: array')
        expect(result.error).toContain('Invalid type at [fieldName.stats.achievements[2]]. Expected: object, Received: string')
      }
    })
  })
})
