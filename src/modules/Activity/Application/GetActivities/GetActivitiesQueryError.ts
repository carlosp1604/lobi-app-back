enum GetActivitiesQueryInputErrorType {
  UNSUPPORTED = 'unsupported',
  MISSING = 'missing',
  VALIDATION = 'validation',
}

export class GetActivitiesQueryInputError {
  private constructor(
    public readonly param: string,
    public readonly error: string | Array<string>,
    public readonly type: GetActivitiesQueryInputErrorType,
  ) {}

  public static validationError(param: string, errorMessage: string | Array<string>): GetActivitiesQueryInputError {
    return new GetActivitiesQueryInputError(param, errorMessage, GetActivitiesQueryInputErrorType.VALIDATION)
  }

  public static unsupportedError(param: string): GetActivitiesQueryInputError {
    return new GetActivitiesQueryInputError(param, 'Provided parameter is not supported', GetActivitiesQueryInputErrorType.UNSUPPORTED)
  }

  public static missingError(param: string): GetActivitiesQueryInputError {
    return new GetActivitiesQueryInputError(
      param,
      'Parameter was not provided but is required',
      GetActivitiesQueryInputErrorType.MISSING,
    )
  }
}

export class GetActivitiesQueryError extends Error {
  public readonly __brand = 'GetActivitiesQueryError' as const

  public readonly id: string
  public readonly name: string
  public readonly errors: Array<GetActivitiesQueryInputError> = []

  public static invalidUserIdId = 'get_activities_query_invalid_user_id'
  public static invalidParamsId = 'get_activities_query_invalid_params'

  private constructor(message: string, id: string, errors?: Array<GetActivitiesQueryInputError>) {
    super(message)
    this.id = id
    this.name = GetActivitiesQueryError.name

    if (errors) {
      this.errors = errors
    }
  }

  public static invalidUserId(domainMessage: string) {
    return new GetActivitiesQueryError(domainMessage, this.invalidUserIdId)
  }

  public static invalidParams(errors: Array<GetActivitiesQueryInputError>) {
    return new GetActivitiesQueryError('Provided params are not valid to perform this operation', this.invalidParamsId, errors)
  }
}
