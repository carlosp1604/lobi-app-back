import { BCryptPasswordHasherService } from '~/src/modules/Auth/Infrastructure/Services/BCryptPasswordHasherService'

describe('BCryptPasswordHasherService', () => {
  const svc = new BCryptPasswordHasherService(4)

  describe('hash', () => {
    it('should return the correct data', async () => {
      const result = await svc.hash('message-to-hash')

      expect(typeof result).toBe('string')
      expect(result.startsWith('$2')).toBe(true)
    })

    it('should not be deterministic', async () => {
      const result1 = await svc.hash('message-to-hash')
      const result2 = await svc.hash('message-to-hash')

      expect(result1).not.toBe(result2)
    })
  })

  describe('compare', () => {
    it('should return false when clear and hash do not match', async () => {
      const result = await svc.hash('message-to-hash')

      await expect(svc.compare('message-to-hash-but-different', result)).resolves.toBe(false)
    })

    it('should return false when hash is not a valid hash', async () => {
      await expect(svc.compare('message', 'not-a-bcrypt-hash')).resolves.toBe(false)
    })

    it('should support empty string', async () => {
      const result = await svc.hash('')

      await expect(svc.compare('', result)).resolves.toBe(true)
    })
  })
})
