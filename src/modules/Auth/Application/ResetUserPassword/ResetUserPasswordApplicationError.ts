enum ResetUserPasswordErrorType {
  VALIDATION = 'validation',
}

export class ResetUserPasswordError {
  private constructor(
    public readonly field: string,
    public readonly error: string | Array<string>,
    public readonly type: ResetUserPasswordErrorType,
  ) {}

  public static validationError(field: string, errorMessage: string) {
    return new ResetUserPasswordError(field, errorMessage, ResetUserPasswordErrorType.VALIDATION)
  }
}

export class ResetUserPasswordApplicationError extends Error {
  public readonly __brand = 'ResetUserPasswordApplicationError' as const

  public readonly id: string
  public readonly name: string
  public readonly errors: Array<ResetUserPasswordError> = []

  public static readonly invalidInputId = 'reset_user_password_application_invalid_input'
  public static readonly tokenNotFoundId = 'reset_user_password_error_token_not_found'
  public static readonly userNotFoundId = 'reset_user_password_error_user_not_found'
  public static readonly userDisabledId = 'reset_user_password_error_user_disabled'
  public static readonly userDoesNotHaveCredentialsId = 'reset_user_password_error_user_does_not_have_credentials'
  public static readonly samePasswordValueId = 'reset_user_password_error_same_password_value'
  public static readonly invalidVerificationTokenId = 'reset_user_password_error_invalid_verification_token'
  public static readonly tokenExpiredId = 'reset_user_password_error_token_expired'
  public static readonly tokenAlreadyUsedId = 'reset_user_password_error_token_already_used'
  public static readonly tokenInvalidOwnerId = 'reset_user_password_error_token_invalid_owner'
  public static readonly tokenPurposeMismatchId = 'reset_user_password_error_token_purpose_mismatch'

  private constructor(message: string, id: string, errors?: Array<ResetUserPasswordError>) {
    super(message)
    this.id = id
    this.name = ResetUserPasswordApplicationError.name

    if (errors) {
      this.errors = errors
    }
  }

  public static invalidInput(errors: Array<ResetUserPasswordError>) {
    return new ResetUserPasswordApplicationError('Input data is not valid to perform this operation', this.invalidInputId, errors)
  }

  public static tokenNotFound() {
    return new ResetUserPasswordApplicationError(
      'No valid verification token was found for the provided email address',
      this.tokenNotFoundId,
    )
  }

  public static userNotFound() {
    return new ResetUserPasswordApplicationError('No user was found for the provided email address', this.userNotFoundId)
  }

  public static userDisabled() {
    return new ResetUserPasswordApplicationError(
      'The user associated with this email address is currently disabled',
      this.userDisabledId,
    )
  }

  public static userDoesNotHaveCredentials() {
    return new ResetUserPasswordApplicationError(
      'The user does not have a password set for local login',
      this.userDoesNotHaveCredentialsId,
    )
  }

  public static samePasswordValue() {
    return new ResetUserPasswordApplicationError('New password cannot be the same as the current password', this.samePasswordValueId)
  }

  public static invalidToken() {
    return new ResetUserPasswordApplicationError('The provided verification code is incorrect', this.invalidVerificationTokenId)
  }

  public static tokenExpired(domainMessage: string) {
    return new ResetUserPasswordApplicationError(domainMessage, this.tokenExpiredId)
  }

  public static tokenAlreadyUsed(domainMessage: string) {
    return new ResetUserPasswordApplicationError(domainMessage, this.tokenAlreadyUsedId)
  }

  public static tokenInvalidOwner(domainMessage: string) {
    return new ResetUserPasswordApplicationError(domainMessage, this.tokenInvalidOwnerId)
  }

  public static tokenPurposeMismatch(domainMessage: string) {
    return new ResetUserPasswordApplicationError(domainMessage, this.tokenPurposeMismatchId)
  }
}
