import jwt from 'jsonwebtoken'
import { JWTokenGeneratorApplicationService } from '~/src/modules/Auth/Infrastructure/Services/JWTokenGeneratorApplicationService'

describe('JWTokenGeneratorApplicationService', () => {
  const secret = 'super-secret'
  const issuer = 'my-app'
  const audience = 'my-users'
  const jwtTokenGeneratorService = new JWTokenGeneratorApplicationService(secret, issuer, audience)

  describe('generateAccessToken', () => {
    const userId = 'user-id'
    const sessionId = 'session-id'

    jest.useFakeTimers().setSystemTime(new Date('2025-09-26T08:52:27Z'))
    const now = new Date()
    const expiresAt = new Date(Date.now() + 120 * 60 * 1000)

    it('should return a valid JWT', async () => {
      const nowSec = Math.floor(now.getTime() / 1000)
      const expSec = Math.floor(expiresAt.getTime() / 1000)

      const token = await jwtTokenGeneratorService.generateAccessToken(userId, sessionId, expiresAt, now)

      // We use verify (from jwt) to get the data from jwt
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer,
        audience,
      }) as jwt.JwtPayload

      const { header } = jwt.decode(token, { complete: true }) as { header: jwt.JwtHeader }

      expect(decoded.sub).toBe(userId)
      expect(decoded.sid).toBe(sessionId)
      expect(decoded.iat).toBe(nowSec)
      expect(decoded.exp).toBe(expSec)
      expect(header.alg).toBe('HS256')
      expect(header.typ).toBe('JWT')
    })
  })

  describe('generateSessionToken', () => {
    it('should return different tokens on each call', async () => {
      const token1 = await jwtTokenGeneratorService.generateSessionToken()
      const token2 = await jwtTokenGeneratorService.generateSessionToken()

      expect(token1.length).toBe(64)
      expect(token2.length).toBe(64)
      expect(token1).not.toBe(token2)
    })
  })
})
