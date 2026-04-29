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

  public static invalidUserIdId = 'create_activity_invalid_user_id'
  public static invalidSportIdId = 'create_activity_invalid_sport_id'
  public static invalidScheduledDateId = 'create_activity_invalid_scheduled_date'
  public static invalidActivityTitleId = 'create_activity_invalid_activity_title'
  public static invalidActivityDescriptionId = 'create_activity_invalid_activity_description'
  public static unsupportedCapabilityId = 'create_activity_unsupported_capability'
  public static invalidCapabilityDataId = 'create_activity_invalid_capability_data'
  public static unsupportedSpecId = 'create_activity_unsupported_spec'
  public static missingSpecId = 'create_activity_missing_spec'
  public static invalidSpecDataId = 'create_activity_invalid_spec_data'
  public static invalidActivityConfigurationId = 'create_activity_invalid_activity_configuration'
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
    return new CreateActivityApplicationError('Input data is not valid to perform this operation', this.invalidUserIdId, errors)
  }

  public static invalidUserId(domainMessage: string) {
    return new CreateActivityApplicationError(domainMessage, this.invalidUserIdId)
  }

  public static invalidSportId(domainMessage: string) {
    return new CreateActivityApplicationError(domainMessage, this.invalidSportIdId)
  }

  public static invalidScheduledDate(domainMessage: string) {
    return new CreateActivityApplicationError(domainMessage, this.invalidScheduledDateId)
  }

  public static invalidActivityTitle(domainMessage: string) {
    return new CreateActivityApplicationError(domainMessage, this.invalidActivityTitleId)
  }

  public static invalidActivityDescription(domainMessage: string) {
    return new CreateActivityApplicationError(domainMessage, this.invalidActivityDescriptionId)
  }

  public static unsupportedCapability(capabilityName: string) {
    return new CreateActivityApplicationError(
      `Capability ${capabilityName} is not supported by selected sport`,
      this.unsupportedCapabilityId,
    )
  }

  public static invalidCapabilityData(domainMessage: string) {
    return new CreateActivityApplicationError(domainMessage, this.invalidCapabilityDataId)
  }

  public static unsupportedSpec(specName: string) {
    return new CreateActivityApplicationError(`Spec ${specName} is not supported by selected sport`, this.unsupportedSpecId)
  }

  public static missingSpec(specName: string) {
    return new CreateActivityApplicationError(`Spec ${specName} was not found but is required by selected sport`, this.missingSpecId)
  }

  public static invalidSpecData(domainMessage: string) {
    return new CreateActivityApplicationError(domainMessage, this.invalidSpecDataId)
  }

  public static invalidActivityConfiguration(domainMessage: string) {
    return new CreateActivityApplicationError(domainMessage, this.invalidActivityConfigurationId)
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
