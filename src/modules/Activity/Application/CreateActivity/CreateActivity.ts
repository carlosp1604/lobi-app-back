import { Activity } from '~/src/modules/Activity/Domain/Activity'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { ActivityTitle } from '~/src/modules/Activity/Domain/ValueObject/ActivityTitle'
import { Participation } from '~/src/modules/Activity/Domain/Participation/Participation'
import { SportRegistry } from '~/src/modules/Activity/Application/Sport/SportRegistry'
import { ActivityDescription } from '~/src/modules/Activity/Domain/ValueObject/ActivityDescription'
import { ActivityScheduledDate } from '~/src/modules/Activity/Domain/ValueObject/ActivityScheduledDate'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { fail, Result, success } from '~/src/modules/Shared/Domain/Result'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserRepositoryInterface } from '~/src/modules/User/Domain/UserRepositoryInterface'
import { SportRepositoryInterface } from '~/src/modules/Activity/Domain/Sport/SportRepositoryInterface'
import { ActivityRepositoryInterface } from '~/src/modules/Activity/Domain/ActivityRepositoryInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { isAvailableCapability, Sport } from '~/src/modules/Activity/Domain/Sport/Sport'
import { ActivityApplicationDtoTranslator } from '~/src/modules/Activity/Application/Translator/ActivityApplicationDtoTranslator'
import { ParticipationRepositoryInterface } from '~/src/modules/Activity/Domain/Participation/ParticipationRepositoryInterface'
import { CreateActivityApplicationRequestDto } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationRequestDto'
import { CreateActivityApplicationResponseDto } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationResponseDto'
import { ParticipationApplicationDtoTranslator } from '~/src/modules/Activity/Application/Translator/ParticipationApplicationDtoTranslator'
import {
  ActivityValidatedConfig,
  ValidatedCapabilities,
  ValidatedSpecs,
} from '~/src/modules/Activity/Domain/ValueObject/ActivityValidatedConfig'
import {
  CreateActivityApplicationError,
  CreateActivityInputError,
} from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationError'

type ValidateUserIdAndSportId = {
  userId: Identifier
  sportId: Identifier
}

type ValidatedActivityData = {
  activityTitle: ActivityTitle
  activityDescription: ActivityDescription | null
  activityScheduledDate: ActivityScheduledDate
  activityConfig: ActivityValidatedConfig
}

export class CreateActivity {
  constructor(
    private userRepository: UserRepositoryInterface,
    private sportRepository: SportRepositoryInterface,
    private activityRepository: ActivityRepositoryInterface,
    private participationRepository: ParticipationRepositoryInterface,
    private clockService: ClockServiceInterface,
    private unitOfWork: UnitOfWork,
    private loggerService: LoggerServiceInterface,
    private idGeneratorService: IdGeneratorServiceInterface,
  ) {}

  public async execute(
    request: CreateActivityApplicationRequestDto,
  ): Promise<Result<CreateActivityApplicationResponseDto, CreateActivityApplicationError>> {
    const now = this.clockService.now()

    const userIdAndSportIdValidationResult = this.validateUserIdAndSportId(request.userId, request.sportId)

    if (!userIdAndSportIdValidationResult.success) {
      return userIdAndSportIdValidationResult
    }

    const { userId, sportId } = userIdAndSportIdValidationResult.value

    const sport = await this.sportRepository.findById(sportId)

    if (!sport) {
      return fail(CreateActivityApplicationError.sportNotFound())
    }

    const activityDataValidationResult = this.validateActivityData(sport, request, now)

    if (!activityDataValidationResult.success) {
      return activityDataValidationResult
    }

    const { activityTitle, activityDescription, activityScheduledDate, activityConfig } = activityDataValidationResult.value

    return this.unitOfWork.runInTransaction(async (context) => {
      const user = await this.userRepository.findById(userId, context)

      if (!user) {
        this.loggerService.warn('Inconsistent state', {
          id: userId.value,
          reason: 'User not found',
        })

        return fail(CreateActivityApplicationError.userNotFound())
      }

      if (!user.isActive()) {
        this.loggerService.warn('Inconsistent state', {
          id: userId.value,
          reason: 'User is disabled',
        })

        return fail(CreateActivityApplicationError.userDisabled())
      }

      const activityId = Identifier.fromString(this.idGeneratorService.generateId())
      const domainEventId = Identifier.fromString(this.idGeneratorService.generateId())

      const newActivity = Activity.create(
        activityId,
        domainEventId,
        activityTitle,
        activityDescription,
        userId,
        activityConfig,
        activityScheduledDate,
        now,
      )

      const participationId = Identifier.fromString(this.idGeneratorService.generateId())

      const newParticipation = Participation.create(participationId, activityId, userId, now)

      await this.activityRepository.save(newActivity, context)
      await this.participationRepository.save(newParticipation, context)

      const activityDto = new ActivityApplicationDtoTranslator().translate(newActivity)
      const participationDto = new ParticipationApplicationDtoTranslator().translate(newParticipation)

      return success({
        activity: activityDto,
        participation: participationDto,
        isUserAdmin: true,
        isUserParticipating: true,
      })
    })
  }

  private validateUserIdAndSportId(
    userId: CreateActivityApplicationRequestDto['userId'],
    sportId: CreateActivityApplicationRequestDto['sportId'],
  ): Result<ValidateUserIdAndSportId, CreateActivityApplicationError> {
    const errors: Array<CreateActivityInputError> = []

    const userIdResult = Identifier.safeCreate(userId)

    if (!userIdResult.success) {
      errors.push(CreateActivityInputError.validationError('userId', userIdResult.error.message))
    }

    const sportIdResult = Identifier.safeCreate(sportId)

    if (!sportIdResult.success) {
      errors.push(CreateActivityInputError.validationError('sportId', sportIdResult.error.message))
    }

    if (!sportIdResult.success || !userIdResult.success) {
      return fail(CreateActivityApplicationError.invalidInput(errors))
    }

    return success({
      userId: userIdResult.value,
      sportId: sportIdResult.value,
    })
  }

  private validateActivityData(
    sport: Sport,
    request: CreateActivityApplicationRequestDto,
    now: Date,
  ): Result<ValidatedActivityData, CreateActivityApplicationError> {
    const errors: Array<CreateActivityInputError> = []

    let activityScheduledDate: ActivityScheduledDate | null = null
    const scheduledDateResult = ActivityScheduledDate.safeCreate(request.scheduledDate)

    if (!scheduledDateResult.success) {
      errors.push(CreateActivityInputError.validationError('scheduledDate', scheduledDateResult.error.message))
    } else {
      const validateResult = scheduledDateResult.value.validate(now)

      if (!validateResult.success) {
        errors.push(CreateActivityInputError.validationError('scheduledDate', validateResult.error.message))
      } else {
        activityScheduledDate = scheduledDateResult.value
      }
    }

    let activityTitle: ActivityTitle | null = null
    const activityTitleResult = ActivityTitle.safeCreate(request.title)

    if (!activityTitleResult.success) {
      errors.push(CreateActivityInputError.validationError('title', activityTitleResult.error.message))
    } else {
      activityTitle = activityTitleResult.value
    }

    let activityDescription: ActivityDescription | null = null

    if (request.description !== null) {
      const activityDescriptionResult = ActivityDescription.safeCreate(request.description)

      if (!activityDescriptionResult.success) {
        errors.push(CreateActivityInputError.validationError('description', activityDescriptionResult.error.message))
      } else {
        activityDescription = activityDescriptionResult.value
      }
    }

    const validatedCapabilities: ValidatedCapabilities = {}
    let hasConfigErrors = false

    for (const [capabilityName, rawValue] of Object.entries(request.config.capabilities)) {
      if (!isAvailableCapability(capabilityName)) {
        errors.push(CreateActivityInputError.unavailableError(`config.capabilities.${capabilityName}`, 'capability'))
        hasConfigErrors = true
        continue
      }

      const capability = SportRegistry.getCapability(capabilityName)

      if (!capability) {
        const error = Error(`System error: Capability validator for '${capabilityName}' is not registered`)

        this.loggerService.error('Invalid configuration', error.stack, {
          capabilityName,
          reason: `Capability validator for '${capabilityName}' is not registered`,
        })

        throw error
      }

      const validationResult = capability.validate(rawValue)

      if (!validationResult.success) {
        errors.push(CreateActivityInputError.validationError(`config.capabilities.${capabilityName}`, validationResult.error.message))
        hasConfigErrors = true
        continue
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      validatedCapabilities[capabilityName] = validationResult.value as any
    }

    if (!request.config.specs.participants) {
      errors.push(CreateActivityInputError.missingSpecError('config.specs.participants'))
      hasConfigErrors = true
    }

    for (const [specName] of Object.entries(request.config.specs)) {
      if (specName !== 'participants') {
        errors.push(CreateActivityInputError.unavailableError(`config.specs.${specName}`, 'spec'))
        hasConfigErrors = true
      }
    }

    let validatedSpecs: ValidatedSpecs | null = null

    if (request.config.specs.participants) {
      const participantsSpec = SportRegistry.getParticipantsSpec()
      const validationResult = participantsSpec.validate(request.config.specs.participants, sport.specs.participants)

      if (!validationResult.success) {
        errors.push(CreateActivityInputError.validationError('config.specs.participants', validationResult.error.message))
        hasConfigErrors = true
      } else {
        validatedSpecs = { participants: validationResult.value }
      }
    }

    let activityConfig: ActivityValidatedConfig | null = null

    if (!hasConfigErrors && validatedSpecs) {
      const activityConfigResult = ActivityValidatedConfig.safeCreate(sport, validatedCapabilities, validatedSpecs)

      if (!activityConfigResult.success) {
        errors.push(CreateActivityInputError.validationError('config', activityConfigResult.error.message))
      } else {
        activityConfig = activityConfigResult.value
      }
    }

    if (errors.length > 0) {
      return fail(CreateActivityApplicationError.invalidInput(errors))
    }

    return success({
      activityTitle: activityTitle!,
      activityDescription,
      activityScheduledDate: activityScheduledDate!,
      activityConfig: activityConfig!,
    })
  }
}
