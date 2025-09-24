import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { Injectable } from '@nestjs/common'

@Injectable()
export class NodeIdGeneratorService implements IdGeneratorServiceInterface {
  /**
   * Generates a new unique identifier
   * @returns the generated identifier
   */
  public generateId(): string {
    return crypto.randomUUID()
  }
}
