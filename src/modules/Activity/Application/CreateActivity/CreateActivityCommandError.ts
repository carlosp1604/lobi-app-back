enum CreateActivityInputErrorType {
  UNAVAILABLE = 'unavailable',
  MISSING = 'missing',
  VALIDATION = 'validation',
  CONFLICT = 'conflict',
}

export class CreateActivityInputError {
  private constructor(
    public readonly field: string,
    public readonly error: string | Array<string>,
    public readonly type: CreateActivityInputErrorType,
  ) {}

  public static validationError(field: string, errorMessage: string | Array<string>): CreateActivityInputError {
    return new CreateActivityInputError(field, errorMessage, CreateActivityInputErrorType.VALIDATION)
  }

  public static unavailableError(field: string, errorMessage: string): CreateActivityInputError {
    return new CreateActivityInputError(field, errorMessage, CreateActivityInputErrorType.UNAVAILABLE)
  }

  public static missingError(field: string, errorMessage: string): CreateActivityInputError {
    return new CreateActivityInputError(field, errorMessage, CreateActivityInputErrorType.MISSING)
  }

  public static conflictError(field: string, errorMessage: string): CreateActivityInputError {
    return new CreateActivityInputError(field, errorMessage, CreateActivityInputErrorType.CONFLICT)
  }
}

export class CreateActivityCommandError extends Error {
  public readonly __brand = 'CreateActivityCommandError' as const

  public readonly id: string
  public readonly name: string
  public readonly errors: Array<CreateActivityInputError> = []

  public static invalidUserIdId = 'create_activity_command_invalid_user_id'
  public static invalidSportIdId = 'create_activity_command_invalid_sport_id'

  public static invalidInputId = 'create_activity_command_invalid_input'
  public static userNotFoundId = 'create_activity_command_user_not_found'
  public static userDisabledId = 'create_activity_command_user_disabled'
  public static sportNotFoundId = 'create_activity_command_sport_not_found'

  private constructor(message: string, id: string, errors?: Array<CreateActivityInputError>) {
    super(message)
    this.id = id
    this.name = CreateActivityCommandError.name

    if (errors) {
      this.errors = errors
    }
  }

  public static invalidUserId(domainMessage: string) {
    return new CreateActivityCommandError(domainMessage, this.invalidUserIdId)
  }

  public static invalidSportId(domainMessage: string) {
    return new CreateActivityCommandError(domainMessage, this.invalidSportIdId)
  }

  public static invalidInput(errors: Array<CreateActivityInputError>) {
    return new CreateActivityCommandError('Input data is not valid to perform this operation', this.invalidInputId, errors)
  }

  public static userNotFound() {
    return new CreateActivityCommandError('No user was found for the provided identifier', this.userNotFoundId)
  }

  public static userDisabled() {
    return new CreateActivityCommandError('The user associated with this identifier is currently disabled', this.userDisabledId)
  }

  public static sportNotFound() {
    return new CreateActivityCommandError('No sport was found for the provided identifier', this.sportNotFoundId)
  }
}
