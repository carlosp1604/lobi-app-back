export interface IdGeneratorServiceInterface {
  /**
   * Generates a new unique identifier
   * @returns the generated identifier
   */
  generateId(): string
}
