import { NodeRandomService } from '~/src/modules/Shared/Infrastructure/Services/NodeRandomService'

describe('NodeRandomService (Integration)', () => {
  describe('getRandomNumericCode', () => {
    it('should return a 6-digit numeric code with correct length and format', () => {
      const service = new NodeRandomService()
      const length = 6

      const code = service.getRandomNumericCode(length)

      expect(code).toHaveLength(length)
      expect(code).toMatch(/^\d{6}$/)
    })

    it('should return different codes on subsequent calls', () => {
      const service = new NodeRandomService()

      const length = 10

      const code1 = service.getRandomNumericCode(length)
      const code2 = service.getRandomNumericCode(length)

      expect(code1).toHaveLength(length)
      expect(code2).toHaveLength(length)
      expect(code1).toMatch(/^\d{10}$/)
      expect(code2).toMatch(/^\d{10}$/)
      expect(code1).not.toEqual(code2)
    })

    it('should return the correct data for the minimum length (1)', () => {
      const service = new NodeRandomService()

      const length = 1

      const code = service.getRandomNumericCode(length)

      expect(code).toHaveLength(length)
      expect(code).toMatch(/^\d{1}$/)
    })

    it('should return the correct data for the maximum length (256)', () => {
      const service = new NodeRandomService()

      const length = 256

      const code = service.getRandomNumericCode(length)

      expect(code).toHaveLength(length)
      expect(code).toMatch(/^\d{256}$/)
    })
  })
})
