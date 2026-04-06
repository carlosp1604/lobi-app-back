export type DomainExceptionContext = {
  [key: string]: unknown
}

export class DomainException extends Error {
  public readonly id: string
  public readonly name: string
  public readonly context: DomainExceptionContext

  constructor(message: string, id: string, name: string, context: DomainExceptionContext = {}) {
    super(message)
    this.id = id
    this.name = name
    this.context = context
  }
}
