export class DomainException extends Error {
  public readonly id: string

  constructor(message: string, id: string) {
    super(message)
    this.id = id
  }
}
