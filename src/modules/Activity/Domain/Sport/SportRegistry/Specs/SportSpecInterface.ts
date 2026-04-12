import { Result } from '~/src/modules/Shared/Domain/Result'
import { SportDomainException } from '~/src/modules/Activity/Domain/Sport/SportDomainException'

export enum SportSpecType {
  PARTICIPANTS_CONFIG = 'participants_config',
}

export type SportSpecRawData = unknown

export interface SportSpecInterface<T> {
  readonly specName: string

  validate(rawValue: SportSpecRawData): Result<T, SportDomainException>
}
