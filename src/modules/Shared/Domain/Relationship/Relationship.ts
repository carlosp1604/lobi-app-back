import { RelationshipDomainException } from '~/src/modules/Shared/Domain/Relationship/RelationshipDomainException'

type State = 'NOT_LOADED' | 'PRESENT' | 'MISSING'

export class Relationship<T> {
  private _value: T | null = null
  private _state: State
  private _dirty: boolean

  private constructor(state: State, value: T | null, dirty: boolean) {
    this._state = state
    this._value = value
    this._dirty = dirty
  }

  static loaded<T>(value: T): Relationship<T> {
    return new Relationship<T>('PRESENT', value, false)
  }

  static missing<T>(): Relationship<T> {
    return new Relationship<T>('MISSING', null, false)
  }

  static notLoaded<T>(): Relationship<T> {
    return new Relationship<T>('NOT_LOADED', null, false)
  }

  static create<T>(value: T): Relationship<T> {
    return new Relationship<T>('PRESENT', value, true)
  }

  update(value: T): void {
    this.ensureLoaded()

    this._value = value
    this._state = 'PRESENT'
    this._dirty = true
  }

  remove(): void {
    this.ensureLoaded()

    if (this._state === 'MISSING') {
      throw RelationshipDomainException.cannotDeleteRelation()
    }

    this._value = null
    this._state = 'MISSING'
    this._dirty = true
  }

  require(): T {
    if (this._state === 'NOT_LOADED') {
      throw RelationshipDomainException.relationNotLoaded()
    }

    if (this._state === 'MISSING') {
      throw RelationshipDomainException.cannotDeleteRelation()
    }

    return this._value as T
  }

  getOrNull(): T | null {
    if (this._state === 'NOT_LOADED') {
      throw RelationshipDomainException.relationNotLoaded()
    }

    return this._value
  }

  isPresent(): boolean {
    return this._state === 'PRESENT'
  }

  isDirty(): boolean {
    return this._dirty
  }

  isLoaded(): boolean {
    return this._state !== 'NOT_LOADED'
  }

  private ensureLoaded(): void {
    if (this._state === 'NOT_LOADED') {
      throw RelationshipDomainException.relationNotLoaded()
    }
  }
}
