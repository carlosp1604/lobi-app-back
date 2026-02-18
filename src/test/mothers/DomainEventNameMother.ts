import { DomainEventName, ValidDomainEventNames } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'

export class DomainEventNameMother {
  public static readonly INVALID_VALUES = [
    '',
    'random-event-name',
    '1111',
    'REMOVE_LOGIN',
    'LOGIN',
    'successFulLogin ',
    'successFulLogOUT',
    'invalid-event-name',
  ]

  public static readonly VALID_VALUES = Object.values(ValidDomainEventNames)

  static valid(): DomainEventName {
    const randomIndex = Math.floor(Math.random() * this.VALID_VALUES.length)
    return DomainEventName.fromString(this.VALID_VALUES[randomIndex])
  }

  static invalid(): string {
    return 'invalid-event-name'
  }
}
