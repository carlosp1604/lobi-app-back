import crypto from 'crypto'
import jwt, { SignOptions } from 'jsonwebtoken'
import { TokenGeneratorApplicationServiceInterface } from '~/src/modules/Auth/Application/TokenGenerator/TokenGeneratorApplicationServiceInterface'

export class JWTokenGeneratorApplicationService implements TokenGeneratorApplicationServiceInterface {
  constructor(
    private readonly accessSecret: string,
    private readonly issuer: string,
    private readonly audience: string,
  ) {}

  /**
   * Generates an access token for the given user and session
   * @param userId User ID
   * @param sessionId Session ID
   * @param expiresAt the expiration date of the token
   * @param now the current timestamp used as the token’s issued-at time
   * @returns the generated access token
   */
  public generateAccessToken(userId: string, sessionId: string, expiresAt: Date, now: Date): Promise<string> {
    const nowSeconds = Math.floor(now.getTime() / 1000)
    const expSeconds = Math.floor(expiresAt.getTime() / 1000)

    if (expSeconds <= nowSeconds) {
      throw new Error('JWT exp value must be greater than iat value')
    }

    const signOpts: SignOptions = {
      algorithm: 'HS256',
      issuer: this.issuer,
      audience: this.audience,
    }

    const payload = {
      sub: userId,
      sid: sessionId,
      iat: nowSeconds,
      exp: expSeconds,
    }

    return Promise.resolve(jwt.sign(payload, this.accessSecret, signOpts))
  }

  /**
   * Generates a session token
   * @returns the generated session token
   */
  public generateSessionToken(): Promise<string> {
    return Promise.resolve(crypto.randomBytes(48).toString('base64'))
  }
}
