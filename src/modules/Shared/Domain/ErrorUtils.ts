export interface NormalizedError {
  message: string
  stack?: string
}

export class ErrorUtils {
  public static normalize(error: unknown): NormalizedError {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
      }
    }

    if (typeof error === 'object' && error !== null) {
      try {
        return {
          message: JSON.stringify(error),
          stack: undefined,
        }
      } catch {
        return {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          message: String(error),
          stack: undefined,
        }
      }
    }

    return {
      message: String(error),
      stack: undefined,
    }
  }
}
