import { RelationshipDomainException } from '~/src/modules/Shared/Domain/Relationship/RelationshipDomainException'
import { RelationshipCollection } from '~/src/modules/Shared/Domain/Relationship/RelationshipCollection'
import { UserIdMother } from '~/src/test/mothers/UserIdMother'
import { UserTestBuilder } from '~/src/test/modules/User/Domain/UserTestBuilder'
import { UserName } from '~/src/modules/User/Domain/ValueObject/UserName'
import { UserId } from '~/src/modules/User/Domain/ValueObject/UserId'
import { User } from '~/src/modules/User/Domain/User'

describe('RelationshipCollection', () => {
  const key1 = UserIdMother.valid()
  const user1 = new UserTestBuilder().withId(key1).build()

  const key2 = UserIdMother.valid()
  const user2 = new UserTestBuilder().withId(key2).build()

  const newName = UserName.fromString('New Name')
  const user1Updated = new UserTestBuilder().withId(key1).withName(newName).build()

  describe('factories', () => {
    it('loaded should create a loaded and empty collection', () => {
      const collection = RelationshipCollection.loaded<User, UserId>()
      expect(collection.isLoaded()).toBe(true)
      expect(collection.count()).toBe(0)
    })

    it('create should create a loaded and empty collection', () => {
      const collection = RelationshipCollection.create<User, UserId>()
      expect(collection.isLoaded()).toBe(true)
      expect(collection.count()).toBe(0)
    })

    it('notLoaded should create a collection that throws on access', () => {
      const collection = RelationshipCollection.notLoaded<User, UserId>()
      expect(collection.isLoaded()).toBe(false)
      expect(() => collection.add(key1, user1)).toThrow(RelationshipDomainException.relationNotLoaded())
      expect(() => collection.remove(key1)).toThrow(RelationshipDomainException.relationNotLoaded())
      expect(() => collection.update(key1, user1)).toThrow(RelationshipDomainException.relationNotLoaded())
      expect(() => collection.getItems()).toThrow(RelationshipDomainException.relationNotLoaded())
      expect(() => collection.count()).toThrow(RelationshipDomainException.relationNotLoaded())
    })
  })

  describe('add', () => {
    it('should add a new item and return true', () => {
      const collection = RelationshipCollection.create<User, UserId>()
      const result = collection.add(key1, user1)

      expect(result).toBe(true)
      expect(collection.count()).toBe(1)
      expect(collection.find(key1)).toEqual(user1)
      expect(collection.getItems()).toContain(user1)
    })

    it('should not add an item with an existing key and return false', () => {
      const collection = RelationshipCollection.create<User, UserId>()
      collection.add(key1, user1)
      const result = collection.add(key1, user1Updated)

      expect(result).toBe(false)
      expect(collection.count()).toBe(1)
      expect(collection.find(key1)).toEqual(user1)
    })

    it('should mark added items as dirty', () => {
      const collection = RelationshipCollection.create<User, UserId>()
      collection.add(key1, user1)
      collection.add(key2, user2)

      expect(collection.dirtyElements()).toHaveLength(2)
      expect(collection.dirtyElements()).toContain(user1)
      expect(collection.dirtyElements()).toContain(user2)
    })
  })

  describe('update', () => {
    it('should update an existing item and return true', () => {
      const collection = RelationshipCollection.create<User, UserId>()
      collection.add(key1, user1)

      const result = collection.update(key1, user1Updated)

      expect(result).toBe(true)
      expect(collection.count()).toBe(1)
      expect(collection.find(key1)).toEqual(user1Updated)
    })

    it('should not update a non-existing item and return false', () => {
      const collection = RelationshipCollection.create<User, UserId>()
      const result = collection.update(key1, user1)

      expect(result).toBe(false)
      expect(collection.count()).toBe(0)
    })

    it('should mark updated items as dirty', () => {
      const collection = RelationshipCollection.create<User, UserId>()
      collection.add(key1, user1)
      collection.update(key1, user1Updated)

      expect(collection.dirtyElements()).toHaveLength(1)
      expect(collection.dirtyElements()[0]).toEqual(user1Updated)
    })
  })

  describe('remove', () => {
    it('should remove an existing item and return true', () => {
      const collection = RelationshipCollection.create<User, UserId>()
      collection.add(key1, user1)
      const result = collection.remove(key1)

      expect(result).toBe(true)
      expect(collection.count()).toBe(0)
      expect(collection.find(key1)).toBeUndefined()
      expect(collection.getItems()).not.toContain(user1)
    })

    it('should not remove a non-existing item and return false', () => {
      const collection = RelationshipCollection.create<User, UserId>()
      const result = collection.remove(key1)
      expect(result).toBe(false)
    })

    it('should track removed elements correctly', () => {
      const collection = RelationshipCollection.create<User, UserId>()
      collection.add(key1, user1)
      collection.add(key2, user2)

      collection.remove(key1)

      expect(collection.removedElements()).toHaveLength(1)
      expect(collection.removedElements()[0].equals(key1)).toBe(true)
      expect(collection.dirtyElements()).toHaveLength(1)
      expect(collection.dirtyElements()).toContain(user2)
    })
  })

  describe('queries (getItems, find, count)', () => {
    it('should handle an empty collection correctly', () => {
      const collection = RelationshipCollection.create<User, UserId>()
      expect(collection.count()).toBe(0)
      expect(collection.getItems()).toEqual([])
      expect(collection.find(key1)).toBeUndefined()
    })

    it('should return all items correctly after several operations', () => {
      const collection = RelationshipCollection.create<User, UserId>()
      collection.add(key1, user1)
      collection.add(key2, user2)
      collection.remove(key1)
      collection.update(key2, user2)

      expect(collection.count()).toBe(1)
      expect(collection.getItems()).toHaveLength(1)
      expect(collection.getItems()[0]).toEqual(user2)
      expect(collection.find(key2)).toEqual(user2)
      expect(collection.find(key1)).toBeUndefined()
    })
  })
})
