import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { UuidMother } from '~/src/test/mothers/UuidMother'

export class UserIdMother extends UuidMother {
  static valid(): UserId {
    return UserId.fromString(UuidMother.validUuidString())
  }

  static invalid(): string {
    return UuidMother.invalidString()
  }
}
