enum GetUserActivitiesQueryInputErrorType {
  UNSUPPORTED = 'unsupported',
  MISSING = 'missing',
  VALIDATION = 'validation',
}

export class GetUserActivitiesQueryInputError {
  private constructor(
    public readonly param: string,
    public readonly error: string | Array<string>,
    public readonly type: GetUserActivitiesQueryInputErrorType,
  ) {}

  public static validationError(param: string, errorMessage: string | Array<string>): GetUserActivitiesQueryInputError {
    return new GetUserActivitiesQueryInputError(param, errorMessage, GetUserActivitiesQueryInputErrorType.VALIDATION)
  }

  public static unsupportedError(param: string, errorMessage: string | Array<string>): GetUserActivitiesQueryInputError {
    return new GetUserActivitiesQueryInputError(param, errorMessage, GetUserActivitiesQueryInputErrorType.UNSUPPORTED)
  }

  public static missingError(param: string, errorMessage: string | Array<string>): GetUserActivitiesQueryInputError {
    return new GetUserActivitiesQueryInputError(param, errorMessage, GetUserActivitiesQueryInputErrorType.MISSING)
  }
}

export class GetUserActivitiesQueryError extends Error {
  public readonly __brand = 'GetUserActivitiesQueryError' as const

  public readonly id: string
  public readonly name: string
  public readonly errors: Array<GetUserActivitiesQueryInputError> = []

  public static invalidUserIdId = 'get_user_activities_query_invalid_user_id'
  public static invalidParamsId = 'get_user_activities_query_invalid_params'

  private constructor(message: string, id: string, errors?: Array<GetUserActivitiesQueryInputError>) {
    super(message)
    this.id = id
    this.name = GetUserActivitiesQueryError.name

    if (errors) {
      this.errors = errors
    }
  }

  public static invalidUserId(domainMessage: string) {
    return new GetUserActivitiesQueryError(domainMessage, this.invalidUserIdId)
  }

  public static invalidParams(errors: Array<GetUserActivitiesQueryInputError>) {
    return new GetUserActivitiesQueryError('Provided params are not valid to perform this operation', this.invalidParamsId, errors)
  }
}
