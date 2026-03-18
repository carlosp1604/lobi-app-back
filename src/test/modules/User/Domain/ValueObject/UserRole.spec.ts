import { UserDomainException } from '~/src/modules/User/Domain/UserDomainException'
import { UserRole, ValidUserRoles } from '~/src/modules/User/Domain/ValueObject/UserRole'
import { UserRoleMother } from '~/src/test/mothers/UserRoleMother'

describe('UserRole', () => {
  describe('fromString', () => {
    it.each(UserRoleMother.VALID_ROLES)('should not throw error when user role is valid: %s', (userRole) => {
      expect(() => UserRole.fromString(String(userRole))).not.toThrow()
    })

    it.each(UserRoleMother.INVALID_ROLES)('should throw error when user role is not valid: %s', (userRole) => {
      expect(() => UserRole.fromString(userRole)).toThrow(UserDomainException.invalidUserRole())
    })
  })

  describe('safeCreate', () => {
    it.each(UserRoleMother.VALID_ROLES)('should return success when user role is valid: %s', (userRole) => {
      const result = UserRole.safeCreate(String(userRole))

      expect(result.success).toBe(true)
    })

    it.each(UserRoleMother.INVALID_ROLES)('should return error when user role is not valid: %s', (userRole) => {
      const result = UserRole.safeCreate(String(userRole))

      expect(result.success).toBe(false)
      expect(result['error']).toStrictEqual(UserDomainException.invalidUserRole())
    })
  })

  describe('factories', () => {
    it('factory should return sportsman', () => {
      const userRoleValueObject = UserRole.sportsman()

      expect(userRoleValueObject.value).toBe(ValidUserRoles.SPORTSMAN)
    })

    it('factory should return owner', () => {
      const userRoleValueObject = UserRole.owner()

      expect(userRoleValueObject.value).toBe(ValidUserRoles.OWNER)
    })
  })

  it('should store the correct value', () => {
    const userRoleValueObject = UserRole.fromString(ValidUserRoles.OWNER)

    expect(userRoleValueObject.value).toBe(ValidUserRoles.OWNER)
  })
})
