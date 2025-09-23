import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import crypto from 'crypto'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class NodeHasherService implements HasherServiceInterface {
  constructor(@Inject() private readonly secret: string) {}

  /**
   * Hashes the given clear text
   * @param clear the plain text value to hash
   * @returns the hashed representation of the value
   */
  public async hash(clear: string): Promise<string> {
    const hmac = crypto.createHmac('sha256', this.secret).update(clear, 'utf8').digest()

    return Promise.resolve(hmac.toString('base64'))
  }

  /**
   * Compares a clear text value with its hashed counterpart
   * @param clear the plain text value to compare
   * @param hashed the hashed value to compare against
   * @returns true if the values match, otherwise false
   */
  public async compare(clear: string, hashed: string): Promise<boolean> {
    const expected = crypto.createHmac('sha256', this.secret).update(clear, 'utf8').digest()
    let provided: Buffer

    try {
      provided = Buffer.from(hashed, 'base64')
    } catch {
      crypto.timingSafeEqual(expected, expected)
      return false
    }

    if (provided.length !== expected.length) {
      crypto.timingSafeEqual(expected, expected)
      return false
    }

    return Promise.resolve(crypto.timingSafeEqual(expected, provided))
  }
}
