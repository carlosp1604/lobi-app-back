import { PasswordHasherServiceInterface } from '~/src/modules/Auth/Domain/PasswordHasherServiceInterface'
import bcrypt from 'bcrypt'
import { Injectable } from '@nestjs/common'

@Injectable()
export class BCryptPasswordHasherService implements PasswordHasherServiceInterface {
  constructor(private readonly saltRounds: number) {}

  /**
   * Hashes the given clear text
   * @param clear the plain text value to hash
   * @returns the hashed representation of the value
   */
  public async hash(clear: string): Promise<string> {
    return bcrypt.hash(clear, this.saltRounds)
  }

  /**
   * Compares a clear text value with its hashed counterpart
   * @param clear the plain text value to compare
   * @param hashed the hashed value to compare against
   * @returns true if the values match, otherwise false
   */
  public async compare(clear: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(clear, hashed)
  }
}
