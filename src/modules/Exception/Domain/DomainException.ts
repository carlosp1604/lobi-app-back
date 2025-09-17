export class DomainException extends Error {
  public readonly id: string
  public readonly name: string

  constructor(message: string, id: string, name: string) {
    super(message)
    this.id = id
    this.name = name
  }
}
