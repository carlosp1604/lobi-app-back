import { UserAgent } from '~/src/modules/Auth/Domain/ValueObject/UserAgent'
import { DomainEvent } from '~/src/modules/Shared/Domain/DomainEvent'
import { EmailAddress } from '~/src/modules/Shared/Domain/ValueObject/EmailAddress'
import { DomainEventId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventId'
import { DeviceLocation } from '~/src/modules/Auth/Domain/ValueObject/DeviceLocation'
import { UuidValueObject } from '~/src/modules/Shared/Domain/ValueObject/UuidValueObject'
import { DomainEventName } from '~/src/modules/Shared/Domain/ValueObject/DomainEventName'
import { DomainEventAggregateId } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateId'
import { DomainEventAggregateType } from '~/src/modules/Shared/Domain/ValueObject/DomainEventAggregateType'

export class AuthDomainEventFactory {
  static createPasswordResetEvent(
    id: string,
    userId: UuidValueObject,
    userEmail: EmailAddress,
    deviceLocation: DeviceLocation | null,
    userAgent: UserAgent,
    ipHash: string | null,
    occurredAt: Date,
  ): DomainEvent {
    return DomainEvent.create(
      DomainEventId.fromString(id),
      DomainEventName.successfulResetPassword(),
      DomainEventAggregateType.user(),
      DomainEventAggregateId.fromString(userId.value),
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
