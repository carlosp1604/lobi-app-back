import { HasherServiceInterface } from '~/src/modules/Auth/Domain/HasherServiceInterface'
import { VerificationToken } from '~/src/modules/Auth/Domain/VerificationToken'

export class VerifyTokenService {
  constructor(private hasher: HasherServiceInterface) {}

  public async verify(token: VerificationToken, candidateValue: string): Promise<boolean> {
    return this.hasher.compare(candidateValue, token.tokenHash.value)
  }
}
