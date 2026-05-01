enum CreateActivityInputErrorType {
  UNAVAILABLE = 'unavailable',
  MISSING = 'missing',
  VALIDATION = 'validation',
}

export class CreateActivityInputError {
  private constructor(
    public readonly field: string,
    public readonly message: string,
    public readonly type: CreateActivityInputErrorType,
  ) {}

  public static validationError(field: string, domainMessage: string): CreateActivityInputError {
    return new CreateActivityInputError(field, domainMessage, CreateActivityInputErrorType.VALIDATION)
  }

  public static unavailableError(field: string, type: 'capability' | 'spec'): CreateActivityInputError {
    const message = `This ${type} is not available`
    return new CreateActivityInputError(field, message, CreateActivityInputErrorType.UNAVAILABLE)
  }

  public static missingSpecError(field: string): CreateActivityInputError {
    const message = 'Spec was not found but is required by selected sport'

    return new CreateActivityInputError(field, message, CreateActivityInputErrorType.MISSING)
  }
}

export class CreateActivityApplicationError extends Error {
  public readonly __brand = 'CreateActivityApplicationError' as const

  public readonly id: string
  public readonly name: string
  public readonly errors: Array<CreateActivityInputError> = []

  public static invalidInputId = 'create_activity_application_invalid_input'
  public static userNotFoundId = 'create_activity_user_not_found'
  public static userDisabledId = 'create_activity_user_disabled'
  public static sportNotFoundId = 'create_activity_sport_not_found'

  private constructor(message: string, id: string, errors?: Array<CreateActivityInputError>) {
    super(message)
    this.id = id
    this.name = CreateActivityApplicationError.name

    if (errors) {
      this.errors = errors
    }
  }

  public static invalidInput(errors: Array<CreateActivityInputError>) {
    return new CreateActivityApplicationError('Input data is not valid to perform this operation', this.invalidInputId, errors)
  }

  public static userNotFound() {
    return new CreateActivityApplicationError('No user was found for the provided identifier', this.userNotFoundId)
  }

  public static userDisabled() {
    return new CreateActivityApplicationError('The user associated with this identifier is currently disabled', this.userDisabledId)
  }

  public static sportNotFound() {
    return new CreateActivityApplicationError('No sport was found for the provided identifier', this.sportNotFoundId)
  }
}
