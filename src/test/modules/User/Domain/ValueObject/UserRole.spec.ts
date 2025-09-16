import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { UserRole, ValidUserRoles } from '~/src/modules/User/Domain/ValueObject/UserRole'

const validUserRoles: Array<ValidUserRoles> = Object.values(ValidUserRoles)

const invalidCases = ['', 'random-role', '1111', 'ADMINISTRATOR', 'ADMin', 'admin ', 'superuser']

describe('UserRole', () => {
  describe('constructor', () => {
    it.each(validUserRoles)('should not throw error when user role is valid: %s', (userRole) => {
      expect(() => UserRole.fromString(String(userRole))).not.toThrow()
    })

    it.each(invalidCases)('should throw error when user role is not valid: %s', (userRole) => {
      expect(() => UserRole.fromString(userRole)).toThrow(UserDomainException.invalidUserRole(userRole))
    })
  })

  describe('get value', () => {
    it('should store the correct value', () => {
      const userRoleValueObject = UserRole.fromString(ValidUserRoles.ADMIN)

      expect(userRoleValueObject.value).toEqual(ValidUserRoles.ADMIN)
    })
  })

  describe('sportsman', () => {
    it('factory should return sportsman', () => {
      const userRoleValueObject = UserRole.sportsman()

      expect(userRoleValueObject.value).toEqual(ValidUserRoles.SPORTSMAN)
    })
  })

  describe('owner', () => {
    it('factory should return owner', () => {
      const userRoleValueObject = UserRole.owner()

      expect(userRoleValueObject.value).toEqual(ValidUserRoles.OWNER)
    })
  })
})
