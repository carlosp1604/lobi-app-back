enum CreateUserErrorType {
  VALIDATION = 'validation',
  CONFLICT = 'conflict',
}

export class CreateUserError {
  private constructor(
    public readonly field: string,
    public readonly error: string | Array<string>,
    public readonly type: CreateUserErrorType,
  ) {}

  public static validationError(field: string, errorMessage: string) {
    return new CreateUserError(field, errorMessage, CreateUserErrorType.VALIDATION)
  }

  public static conflictError(field: string) {
    return new CreateUserError(field, 'Value is already in use', CreateUserErrorType.CONFLICT)
  }
}

export class CreateUserApplicationError extends Error {
  public readonly __brand = 'CreateUserError' as const

  public readonly id: string
  public readonly name: string
  public readonly errors: Array<CreateUserError> = []

  public static invalidInputId = 'create_user_invalid_input'
  public static duplicatedDataId = 'create_user_duplicated_data'
  public static tokenNotFoundId = 'create_user_error_token_not_found'
  public static invalidVerificationTokenId = 'create_user_error_invalid_verification_token'
  public static tokenExpiredId = 'create_user_error_token_expired'
  public static tokenAlreadyUsedId = 'create_user_error_token_already_used'
  public static tokenInvalidOwnerId = 'create_user_error_token_invalid_owner'
  public static tokenPurposeMismatchId = 'create_user_error_token_purpose_mismatch'

  private constructor(message: string, id: string, errors?: Array<CreateUserError>) {
    super(message)
    this.id = id
    this.name = CreateUserApplicationError.name

    if (errors) {
      this.errors = errors
    }
  }

  public static invalidInput(errors: Array<CreateUserError>) {
    return new CreateUserApplicationError('Input data is not valid to perform this operation', this.invalidInputId, errors)
  }

  public static duplicatedData(errors: Array<CreateUserError>) {
    return new CreateUserApplicationError('Input data is not available to perform this operation', this.duplicatedDataId, errors)
  }

  public static tokenNotFound() {
    return new CreateUserApplicationError('No valid verification token was found for the provided email address', this.tokenNotFoundId)
  }

  public static invalidToken() {
    return new CreateUserApplicationError('The provided verification code is incorrect', this.invalidVerificationTokenId)
  }

  public static tokenExpired(domainMessage: string) {
    return new CreateUserApplicationError(domainMessage, this.tokenExpiredId)
  }

  public static tokenAlreadyUsed(domainMessage: string) {
    return new CreateUserApplicationError(domainMessage, this.tokenAlreadyUsedId)
  }

  public static tokenInvalidOwner(domainMessage: string) {
    return new CreateUserApplicationError(domainMessage, this.tokenInvalidOwnerId)
  }

  public static tokenPurposeMismatch(domainMessage: string) {
    return new CreateUserApplicationError(domainMessage, this.tokenPurposeMismatchId)
  }
}
