import { HmacHasherService } from '~/src/modules/Auth/Infrastructure/Services/HmacHasherService'

describe('HmacHasherService', () => {
  const hasherServiceA = new HmacHasherService('test-secret-a')
  const hasherServiceB = new HmacHasherService('test-secret-b')

  const b64regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/

  describe('hash', () => {
    it('should return a valid hash Base64 encoded', async () => {
      const result = await hasherServiceA.hash('message-to-hash')

      expect(typeof result).toBe('string')
      expect(result).toMatch(b64regex)
    })

    it('should return the same value for the same input and secret', async () => {
      const result1 = await hasherServiceA.hash('message-to-hash')
      const result2 = await hasherServiceA.hash('message-to-hash')

      expect(result1).toBe(result2)
    })

    it('should return a different value for different inputs and same secret', async () => {
      const result1 = await hasherServiceA.hash('message-to-hash')
      const result2 = await hasherServiceA.hash('message-to-hash-but-different')

      expect(result1).not.toBe(result2)
    })

    it('should return a different value for the same input and different secret', async () => {
      const resultA = await hasherServiceA.hash('message-to-hash')
      const resultB = await hasherServiceB.hash('message-to-hash')

      expect(resultA).not.toBe(resultB)
    })
  })

  describe('compare', () => {
    it('should return true when clear and hash match', async () => {
      const clear = 'message-to-hash'
      const hashed = await hasherServiceA.hash(clear)

      await expect(hasherServiceA.compare(clear, hashed)).resolves.toBe(true)
    })

    it('should return false when clear and hash do not match', async () => {
      const clear = 'message-to-hash'
      const hashed = await hasherServiceA.hash(clear)

      await expect(hasherServiceA.compare('different-message', hashed)).resolves.toBe(false)
    })

    it('should return false when clear and hash do not match due to different secret', async () => {
      const clear = 'message-to-hash'
      const hashed = await hasherServiceA.hash(clear)

      await expect(hasherServiceB.compare(clear, hashed)).resolves.toBe(false)
    })

    it('should return false if hashed input is not base64 encoded', async () => {
      await expect(hasherServiceA.compare('message-to-compare', '*im-not-a-base-64-message*')).resolves.toBe(false)
    })

    it('should return false if hashed is not a valid base64 string', async () => {
      const hashed = await hasherServiceA.hash('message-to-hash')
      const modifiedHash = hashed + 'AB'

      await expect(hasherServiceA.compare('message-to-hash', modifiedHash)).resolves.toBe(false)
    })

    it('should return false if hashed hash incorrect padding', async () => {
      const hashed = await hasherServiceA.hash('message-to-hash')
      const incorrectPadding = hashed.replace(/=*$/, '==')

      await expect(hasherServiceA.compare('message-to-hash', incorrectPadding)).resolves.toBe(false)
    })

    it('should return false if expected (clear hashed and encoded) and hashed do not have the same length', async () => {
      const hashed = await hasherServiceA.hash('message-to-hash')
      const modifiedHash = hashed.replace(/.$/, 'Z')

      await expect(hasherServiceA.compare('message-to-hash', modifiedHash)).resolves.toBe(false)
    })
  })
})
