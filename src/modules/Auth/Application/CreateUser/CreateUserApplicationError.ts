export class CreateUserApplicationError {
  public readonly id: string
  public readonly name: string
  public readonly errors: Array<CreateUserError>

  public static invalidInputId = 'create_user_application_invalid_input'
  public static duplicatedId = 'create_user_application_duplicated'
  public static notFoundId = 'create_user_application_not_found'
  public static invalidTokenId = 'create_user_application_invalid_token'

  private constructor(id: string, errors: Array<CreateUserError>) {
    this.id = id
    this.name = CreateUserApplicationError.name
    this.errors = errors
  }

  public static invalidInput(errors: Array<CreateUserError>) {
    return new CreateUserApplicationError(this.invalidInputId, errors)
  }

  public static duplicated(errors: Array<CreateUserError>) {
    return new CreateUserApplicationError(this.duplicatedId, errors)
  }

  public static notFound(error: CreateUserError) {
    return new CreateUserApplicationError(this.notFoundId, [error])
  }

  public static invalidToken(error: CreateUserError) {
    return new CreateUserApplicationError(this.invalidTokenId, [error])
  }
}

export class CreateUserError extends Error {
  public readonly __brand = 'CreateUserError' as const

  public readonly id: string
  public readonly name: string

  public static invalidNameId = 'create_user_error_invalid_name'
  public static invalidUsernameId = 'create_user_error_invalid_username'
  public static invalidEmailId = 'create_user_error_invalid_email'
  public static invalidPasswordId = 'create_user_error_invalid_password'
  public static invalidRoleId = 'create_user_error_invalid_role'
  public static invalidTokenFormatId = 'create_user_error_invalid_token_format'
  public static tokenNotFoundId = 'create_user_error_token_not_found'
  public static duplicatedEmailId = 'create_user_error_duplicated_email'
  public static duplicatedUsernameId = 'create_user_error_duplicated_username'
  public static invalidVerificationTokenId = 'create_user_error_invalid_verification_token'
  public static tokenExpiredId = 'create_user_error_token_expired'
  public static tokenAlreadyUsedId = 'create_user_error_token_already_used'
  public static tokenInvalidOwnerId = 'create_user_error_token_invalid_owner'
  public static tokenPurposeMismatchId = 'create_user_error_token_purpose_mismatch'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = CreateUserError.name
  }

  public static invalidName() {
    return new CreateUserError('Invalid user name', this.invalidNameId)
  }

  public static invalidUsername() {
    return new CreateUserError('Invalid username', this.invalidUsernameId)
  }

  public static invalidEmail() {
    return new CreateUserError('Invalid email', this.invalidEmailId)
  }

  public static invalidPassword() {
    return new CreateUserError('Invalid password', this.invalidPasswordId)
  }

  public static invalidRole() {
    return new CreateUserError('Invalid user role', this.invalidRoleId)
  }

  public static invalidTokenFormat() {
    return new CreateUserError('Invalid token format', this.invalidTokenFormatId)
  }

  public static tokenNotFound(email: string) {
    return new CreateUserError(`Token associated to email ${email} was not found`, this.tokenNotFoundId)
  }

  public static duplicatedEmail(email: string) {
    return new CreateUserError(`The email ${email} is already registered`, this.duplicatedEmailId)
  }

  public static duplicatedUsername(username: string) {
    return new CreateUserError(`The username ${username} is already taken`, this.duplicatedUsernameId)
  }

  public static invalidToken() {
    return new CreateUserError('The provided token code does not match the stored hash', this.invalidVerificationTokenId)
  }

  public static tokenExpired() {
    return new CreateUserError('The verification token has already expired', this.tokenExpiredId)
  }

  public static tokenAlreadyUsed() {
    return new CreateUserError('The verification token has already been used', this.tokenAlreadyUsedId)
  }

  public static tokenInvalidOwner() {
    return new CreateUserError('The verification token does not belong to the provided email address', this.tokenInvalidOwnerId)
  }

  public static tokenPurposeMismatch() {
    return new CreateUserError('The token cannot be used for the requested purpose', this.tokenPurposeMismatchId)
  }
}
