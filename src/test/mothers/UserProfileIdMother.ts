import { UuidMother } from '~/src/test/mothers/UuidMother'
import { UserProfileId } from '~/src/modules/User/Domain/ValueObject/Profile/UserProfileId'

export class UserProfileIdMother extends UuidMother {
  static valid(): UserProfileId {
    return UserProfileId.fromString(UuidMother.validUuidString())
  }

  static invalid(): string {
    return UuidMother.invalidString()
  }
}
