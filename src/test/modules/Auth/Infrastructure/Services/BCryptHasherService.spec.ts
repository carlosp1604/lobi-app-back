import { BCryptHasherService } from '~/src/modules/Auth/Infrastructure/Services/BCryptHasherService'

describe('BCryptHasherService', () => {
  const service = new BCryptHasherService(4)

  describe('hash', () => {
    it('should return the correct data', async () => {
      const result = await service.hash('message-to-hash')

      expect(typeof result).toBe('string')
      expect(result.startsWith('$2')).toBe(true)
    })

    it('should not be deterministic', async () => {
      const result1 = await service.hash('message-to-hash')
      const result2 = await service.hash('message-to-hash')

      expect(result1).not.toBe(result2)
    })
  })

  describe('compare', () => {
    it('should return false when clear and hash do not match', async () => {
      const result = await service.hash('message-to-hash')

      await expect(service.compare('message-to-hash-but-different', result)).resolves.toBe(false)
    })

    it('should return false when hash is not a valid hash', async () => {
      await expect(service.compare('message', 'not-a-bcrypt-hash')).resolves.toBe(false)
    })

    it('should support empty string', async () => {
      const result = await service.hash('')

      await expect(service.compare('', result)).resolves.toBe(true)
    })
  })
})
