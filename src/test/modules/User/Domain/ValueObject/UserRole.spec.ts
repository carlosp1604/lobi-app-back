import { UserDomainException } from '~/src/modules/Users/Domain/UserDomainException'
import { UserRole, ValidUserRoles } from '~/src/modules/Users/Domain/ValueObject/UserRole'

const validUserRoles: Array<ValidUserRoles> = Object.values(ValidUserRoles)

const invalidCases = ['', 'random-role', '1111', 'ADMINISTRATOR', 'user ', 'superuser']

describe('UserRole', () => {
  it.each(validUserRoles)('should not throw error when user role is valid: %s', (userRole) => {
    expect(() => UserRole.fromString(String(userRole))).not.toThrow()
  })

  it.each(invalidCases)('should throw error when user role is not valid: %s', (userRole) => {
    expect(() => UserRole.fromString(userRole)).toThrow(UserDomainException.invalidUserRole(userRole))
  })

  it('should store the correct value', () => {
    const userRoleValueObject = UserRole.fromString(ValidUserRoles.ADMIN)

    expect(userRoleValueObject.value).toEqual(ValidUserRoles.ADMIN)
  })
})
