import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { JWTokenGeneratorApplicationService } from '~/src/modules/Auth/Infrastructure/Services/JWTokenGeneratorApplicationService'

describe('JWTokenGeneratorApplicationService', () => {
  const secret = 'super-secret'
  const issuer = 'lobi-app'
  const audience = 'lobi-users'

  let jwtTokenGeneratorService: JWTokenGeneratorApplicationService

  beforeEach(() => {
    jwtTokenGeneratorService = new JWTokenGeneratorApplicationService(secret, issuer, audience)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  describe('generateAccessToken', () => {
    const userId = 'user-id'
    const sessionId = 'session-id'
    const now = new Date('2025-09-26T08:52:27Z')
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000)

    it('should call to jwt with correct payload and options', async () => {
      const mockJwtSign = jest.spyOn(jwt, 'sign').mockReturnValueOnce('signed-token' as any)

      const nowSec = Math.floor(now.getTime() / 1000)
      const expSec = Math.floor(expiresAt.getTime() / 1000)

      await jwtTokenGeneratorService.generateAccessToken(userId, sessionId, expiresAt, now)

      expect(mockJwtSign).toHaveBeenCalledWith(
        {
          sub: userId,
          sid: sessionId,
          iat: nowSec,
          exp: expSec,
        },
        secret,
        {
          algorithm: 'HS256',
          issuer,
          audience,
        },
      )
    })

    it('should return the correct data', async () => {
      jest.spyOn(jwt, 'sign').mockReturnValueOnce('signed-token' as any)

      const token = await jwtTokenGeneratorService.generateAccessToken(userId, sessionId, expiresAt, now)

      expect(token).toBe('signed-token')
    })

    it('should throw error if exp <= iat', () => {
      const expiresAtSameAsNow = new Date(now.getTime())

      expect(() => jwtTokenGeneratorService.generateAccessToken('user', 'session', expiresAtSameAsNow, now)).toThrow(
        Error('JWT exp value must be greater than iat value'),
      )
    })
  })

  describe('generateSessionToken', () => {
    it('should call to randomBytes correctly', async () => {
      const expectedBuffer = Buffer.from('super-random-token')
      const randomBytesSpy = jest.spyOn(crypto, 'randomBytes').mockReturnValue(expectedBuffer as any)

      await jwtTokenGeneratorService.generateSessionToken()
      expect(randomBytesSpy).toHaveBeenCalledWith(48)
    })

    it('should return the correct data', async () => {
      const expectedBuffer = Buffer.from('super-random-token')
      jest.spyOn(crypto, 'randomBytes').mockReturnValue(expectedBuffer as any)

      const token = await jwtTokenGeneratorService.generateSessionToken()
      expect(token).toBe(expectedBuffer.toString('base64'))
    })
  })
})
