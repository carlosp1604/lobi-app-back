import { RelationshipDomainException } from '~/src/modules/Shared/Domain/Relationship/RelationshipDomainException'
import { Relationship } from '~/src/modules/Shared/Domain/Relationship/Relationship'

describe('Relationship', () => {
  const object1 = { x: 1 }
  const object2 = { x: 2 }

  describe('factories', () => {
    it('loaded should return a loaded relationship (not null)', () => {
      const relationship = Relationship.loaded(object1)

      expect(relationship.isPresent()).toBe(true)
      expect(relationship.isLoaded()).toBe(true)
      expect(relationship.isDirty()).toBe(false)
      expect(relationship.getOrNull()).toBe(object1)
      expect(relationship.require()).toBe(object1)
    })

    it('missing should return a missing relationship (null)', () => {
      const relationship = Relationship.missing<typeof object1>()

      expect(relationship.isPresent()).toBe(false)
      expect(relationship.isLoaded()).toBe(true)
      expect(relationship.isDirty()).toBe(false)
      expect(relationship.getOrNull()).toBeNull()
      expect(() => relationship.require()).toThrow(RelationshipDomainException.cannotDeleteRelation())
    })

    it('notLoaded should return a not loaded relationship (throws when try to access it)', () => {
      const relationship = Relationship.notLoaded<typeof object1>()

      expect(relationship.isPresent()).toBe(false)
      expect(relationship.isLoaded()).toBe(false)
      expect(relationship.isDirty()).toBe(false)
      expect(() => relationship.getOrNull()).toThrow(RelationshipDomainException.relationNotLoaded())
      expect(() => relationship.require()).toThrow(RelationshipDomainException.relationNotLoaded())
    })

    it('create should return a new relationship (loaded and dirty)', () => {
      const relationship = Relationship.create(object1)

      expect(relationship.isPresent()).toBe(true)
      expect(relationship.isLoaded()).toBe(true)
      expect(relationship.isDirty()).toBe(true)
      expect(relationship.getOrNull()).toBe(object1)
      expect(relationship.require()).toBe(object1)
    })
  })

  describe('update', () => {
    it('should mark as dirty if update a PRESENT relationship', () => {
      const relationship = Relationship.loaded(object1)

      relationship.update(object2)

      expect(relationship.isPresent()).toBe(true)
      expect(relationship.isDirty()).toBe(true)
      expect(relationship.require()).toBe(object2)
    })

    it('should mark as dirty and move to PRESENT stat if update a MISSING relationship', () => {
      const relationship = Relationship.missing<typeof object1>()

      relationship.update(object1)

      expect(relationship.isPresent()).toBe(true)
      expect(relationship.isDirty()).toBe(true)
      expect(relationship.getOrNull()).toBe(object1)
    })

    it('should throw error if update a NOT_LOADED relationship', () => {
      const relationship = Relationship.notLoaded<any>()

      expect(() => relationship.update(object1)).toThrow(RelationshipDomainException)
    })
  })

  describe('remove', () => {
    it('should mark as dirty, move to MISSING and set value to NULL if remove a PRESENT relationship', () => {
      const relationship = Relationship.loaded(object1)

      relationship.remove()

      expect(relationship.isPresent()).toBe(false)
      expect(relationship.isLoaded()).toBe(true)
      expect(relationship.isDirty()).toBe(true)
      expect(relationship.getOrNull()).toBeNull()

      expect(() => relationship.require()).toThrow(RelationshipDomainException.cannotDeleteRelation())
    })

    it('should throw error if remove a MISSING relationship', () => {
      const relationship = Relationship.missing<typeof object1>()

      expect(() => relationship.remove()).toThrow(RelationshipDomainException.cannotDeleteRelation())
    })

    it('should throw error if remove a NOT_LOADED relationship', () => {
      const relationship = Relationship.notLoaded<typeof object1>()

      expect(() => relationship.remove()).toThrow(RelationshipDomainException)
    })
  })

  describe('isLoaded', () => {
    it('should return true if relationship is not in NOT_LOADED state', () => {
      expect(Relationship.missing().isLoaded()).toBe(true)
      expect(Relationship.loaded(object1).isLoaded()).toBe(true)
      expect(Relationship.create(object1).isLoaded()).toBe(true)
    })

    it('should return true if relationship is in NOT_LOADED state', () => {
      expect(Relationship.notLoaded().isLoaded()).toBe(false)
    })
  })
})
