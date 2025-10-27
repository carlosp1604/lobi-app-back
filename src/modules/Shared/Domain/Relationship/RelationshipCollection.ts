import { RelationshipDomainException } from '~/src/modules/Shared/Domain/Relationship/RelationshipDomainException'
import { Relationship } from '~/src/modules/Shared/Domain/Relationship/Relationship'

interface EntityId {
  equals(otherId: any): boolean
}

interface RelationshipCollectionItem<T, K extends EntityId> {
  key: K
  value: Relationship<T>
}

export class RelationshipCollection<T, K extends EntityId> {
  private _items: Array<RelationshipCollectionItem<T, K>> = []
  private readonly _isLoaded: boolean

  private constructor(isLoaded: boolean) {
    this._isLoaded = isLoaded
  }

  static loaded<T, K extends EntityId>(): RelationshipCollection<T, K> {
    return new RelationshipCollection<T, K>(true)
  }

  static notLoaded<T, K extends EntityId>(): RelationshipCollection<T, K> {
    return new RelationshipCollection<T, K>(false)
  }

  static create<T, K extends EntityId>(): RelationshipCollection<T, K> {
    return new RelationshipCollection<T, K>(true)
  }

  public add(key: K, item: T): boolean {
    this.ensureLoaded()

    const itemExists = this._items.find((_item) => _item.key.equals(key))

    if (itemExists) {
      return false
    }

    const newItem: RelationshipCollectionItem<T, K> = {
      key,
      value: Relationship.create(item),
    }

    this._items.push(newItem)

    return true
  }

  public update(key: K, item: T): boolean {
    this.ensureLoaded()

    const itemExists = this._items.find((_item) => _item.key.equals(key))

    if (!itemExists) {
      return false
    }

    itemExists.value.update(item)

    return true
  }

  public remove(key: K): boolean {
    this.ensureLoaded()

    const itemExists = this._items.find((_item) => _item.key.equals(key))

    if (!itemExists) {
      return false
    }

    itemExists.value.remove()
    return true
  }

  public getItems(): Array<T> {
    this.ensureLoaded()
    return this.filterRemoved().map((item) => item.value.getOrNull() as T)
  }

  public find(key: K): T | undefined {
    this.ensureLoaded()

    const filteredElements = this.filterRemoved()

    const foundElement = filteredElements.find((item) => item.key.equals(key))

    if (!foundElement) {
      return undefined
    }

    return foundElement.value.getOrNull() as T
  }

  public count(): number {
    this.ensureLoaded()
    const filteredElements = this.filterRemoved()
    return filteredElements.length
  }

  public isLoaded(): boolean {
    return this._isLoaded
  }

  public dirtyElements(): Array<T> {
    return this._items.filter((item) => item.value.getOrNull() && item.value.isDirty()).map((item) => item.value.getOrNull() as T)
  }

  public removedElements(): Array<K> {
    return this._items.filter((item) => item.value.getOrNull() === null && item.value.isDirty()).map((item) => item.key)
  }

  private ensureLoaded(): void {
    if (!this._isLoaded) {
      throw RelationshipDomainException.relationNotLoaded()
    }
  }

  private filterRemoved(): Array<RelationshipCollectionItem<T, K>> {
    return this._items.filter((item) => item.value.getOrNull())
  }
}
