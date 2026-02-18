import { User } from '~/src/modules/User/Domain/User'
import { UserRole } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserStatus } from '~/src/modules/User/Domain/ValueObject/UserStatus'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserEmailMother } from '~/src/test/mothers/UserEmailMother'
import { UserUsernameMother } from '~/src/test/mothers/UserUsernameMother'
import { UserNameMother } from '~/src/test/mothers/UserNameMother'

describe('create', () => {
  it('should initialize the User instance correctly', () => {
    const now = new Date('2025-01-02T03:04:05.000Z')
    const id = UserIdMother.valid()
    const email = UserEmailMother.valid()
    const username = UserUsernameMother.valid()
    const name = UserNameMother.valid()
    const role = UserRole.sportsman()

    const user = User.create(id, email, username, name, role, now)

    expect(user.id.equals(id)).toBe(true)
    expect(user.email.equals(email)).toBe(true)
    expect(user.username.equals(username)).toBe(true)
    expect(user.name.equals(name)).toBe(true)
    expect(user.role.equals(UserRole.sportsman())).toBe(true)
    expect(user.userUploadId).toBeNull()
    expect(user.status.equals(UserStatus.active())).toBe(true)
    expect(user.emailVerifiedAt.getTime()).toBe(now.getTime())
    expect(user.createdAt.getTime()).toBe(now.getTime())
    expect(user.updatedAt.getTime()).toBe(now.getTime())
    expect(user.deletedAt).toBeNull()
  })
})
