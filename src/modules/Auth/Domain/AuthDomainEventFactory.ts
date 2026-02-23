import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'

export class AuthDomainEventFactory {
  constructor(private readonly idGenerator: IdGeneratorServiceInterface) {}

  public createPasswordResetEvent(
    userId: Identifier,
    userEmail: EmailAddress,
    deviceLocation: DeviceLocation | null,
    userAgent: UserAgent,
    ipHash: string | null,
    occurredAt: Date,
  ): DomainEvent {
    return DomainEvent.create(
      Identifier.fromString(this.idGenerator.generateId()),
      DomainEventName.successfulResetPassword(),
      DomainEventAggregateType.user(),
      userId,
      {
        userId: userId.value,
        email: userEmail.value,
        deviceLocation: deviceLocation
          ? {
              city: deviceLocation.city,
              countryCode: deviceLocation.countryCode,
            }
          : null,
      },
      {
        ipHash: ipHash,
        ua: userAgent.value,
      },
      occurredAt,
    )
  }
}
