import crypto from 'node:crypto'
import { NodeHasherService } from '~/src/modules/Auth/Infrastructure/Services/NodeHasherService'

describe('NodeHasherService', () => {
  let svc: NodeHasherService

  beforeEach(() => {
    svc = new NodeHasherService('secret')
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  const mockHmac = (buf: Buffer) => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue(buf),
  })

  describe('hash', () => {
    it('should call to crypto and Hmac methods correctly', async () => {
      const expectedBuffer = Buffer.from('abc')
      const expectedHmac = mockHmac(expectedBuffer)
      const createHmacSpy = jest.spyOn(crypto, 'createHmac').mockReturnValue(expectedHmac as any)

      await svc.hash('clear')

      expect(createHmacSpy).toHaveBeenCalledWith('sha256', 'secret')
      expect(expectedHmac.update).toHaveBeenCalledWith('clear', 'utf8')
      expect(expectedHmac.digest).toHaveBeenCalled()
    })

    it('should return the correct data', async () => {
      const expectedBuf = Buffer.from('abc')
      jest.spyOn(crypto, 'createHmac').mockReturnValue(mockHmac(expectedBuf) as any)

      const result = await svc.hash('clear')

      expect(result).toBe('YWJj')
    })
  })

  describe('compare', () => {
    it('should call crypto correctly', async () => {
      const expectedHashedBuffer = Buffer.alloc(32, 0x11)
      const expectedHmac = mockHmac(expectedHashedBuffer)

      const createHmacSpy = jest.spyOn(crypto, 'createHmac').mockReturnValue(expectedHmac as any)
      const timingSafeEqualSpy = jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(true)

      const validB64 = expectedHashedBuffer.toString('base64')

      await svc.compare('clear', validB64)

      expect(createHmacSpy).toHaveBeenCalledWith('sha256', 'secret')
      expect(expectedHmac.update).toHaveBeenCalledWith('clear', 'utf8')
      expect(expectedHmac.digest).toHaveBeenCalled()
      expect(timingSafeEqualSpy).toHaveBeenCalledWith(expectedHashedBuffer, expect.any(Buffer))
    })

    it('should return true if hashed and clear match', async () => {
      const expectedHashedBuffer = Buffer.alloc(32, 0x11)
      const expectedHmac = mockHmac(expectedHashedBuffer)

      jest.spyOn(crypto, 'createHmac').mockReturnValue(expectedHmac as any)
      jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(true)

      expectedHashedBuffer.toString('base64')

      const validB64 = expectedHashedBuffer.toString('base64')

      const result = await svc.compare('clear', validB64)

      expect(result).toBe(true)
    })

    it('should return false if hashed is not a base64 string', async () => {
      const expectedHashedBuffer = Buffer.alloc(32, 0x11)
      const expectedHmac = mockHmac(expectedHashedBuffer)

      jest.spyOn(crypto, 'createHmac').mockReturnValue(expectedHmac as any)
      const timingSafeEqualSpy = jest.spyOn(crypto, 'timingSafeEqual')

      const result = await svc.compare('clear', 'invalid-base-64-hash')

      expect(timingSafeEqualSpy).toHaveBeenCalledWith(expectedHashedBuffer, expectedHashedBuffer)
      expect(result).toBe(false)
    })

    it('should return false if Buffer.from throws error', async () => {
      const expectedHashedBuffer = Buffer.alloc(32, 0x11)
      const expectedHmac = mockHmac(expectedHashedBuffer)

      jest.spyOn(crypto, 'createHmac').mockReturnValue(expectedHmac as any)
      const timingSafeEqualSpy = jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(true)
      jest.spyOn(Buffer, 'from').mockImplementationOnce(() => {
        throw Error('Unexpected error')
      })

      const validB64 = expectedHashedBuffer.toString('base64')

      const result = await svc.compare('clear', validB64)

      expect(timingSafeEqualSpy).toHaveBeenCalledWith(expectedHashedBuffer, expectedHashedBuffer)
      expect(result).toBe(false)
    })

    it('should return false if calculated hashed and input hashed decode to different lengths', async () => {
      const expectedHashedBuffer = Buffer.alloc(32, 0x11)
      const expectedHmac = mockHmac(expectedHashedBuffer)

      jest.spyOn(crypto, 'createHmac').mockReturnValue(expectedHmac as any)
      const timingSafeEqualSpy = jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(true)

      const shorterB64 = Buffer.alloc(16, 0x22).toString('base64')

      const result = await svc.compare('clear', shorterB64)

      expect(timingSafeEqualSpy).toHaveBeenCalledWith(expectedHashedBuffer, expectedHashedBuffer) // blinding
      expect(result).toBe(false)
    })

    it('should return true when timingSafeEqual returns true', async () => {
      const expectedHashedBuffer = Buffer.alloc(32, 0x11)
      const expectedHmac = mockHmac(expectedHashedBuffer)

      jest.spyOn(crypto, 'createHmac').mockReturnValue(expectedHmac as any)
      const timingSafeEqualSpy = jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(false)

      const validB64 = expectedHashedBuffer.toString('base64')

      const result = await svc.compare('clear', validB64)

      expect(result).toBe(false)
      expect(timingSafeEqualSpy).toHaveBeenCalledWith(expectedHashedBuffer, expect.any(Buffer))
    })
  })
})
