import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import crypto from 'crypto'

const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/

export class NodeHasherService implements HasherServiceInterface {
  constructor(private readonly secret: string) {}

  /**
   * Hashes the given clear text and returns the result encoded in Base64
   * @param clear the plain text value to hash
   * @returns the hashed representation of the value, encoded in Base64
   */
  public async hash(clear: string): Promise<string> {
    const hmac = crypto.createHmac('sha256', this.secret).update(clear, 'utf8').digest()

    return Promise.resolve(hmac.toString('base64'))
  }

  /**
   * Compares a clear text value with its hashed counterpart
   * @param clear the plain text value to compare
   * @param hashed the hashed value (Base64 encoded) to compare against
   * @returns true if the values match, otherwise false
   */
  public async compare(clear: string, hashed: string): Promise<boolean> {
    const expected = crypto.createHmac('sha256', this.secret).update(clear, 'utf8').digest()

    try {
      if (!BASE64.test(hashed)) {
        crypto.timingSafeEqual(expected, expected)
        return false
      }

      const provided = Buffer.from(hashed, 'base64')

      if (provided.length !== expected.length) {
        crypto.timingSafeEqual(expected, expected)
        return false
      }

      return Promise.resolve(crypto.timingSafeEqual(expected, provided))
    } catch {
      crypto.timingSafeEqual(expected, expected)
      return false
    }
  }
}
