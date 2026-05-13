import { Sport } from '~/src/modules/Activity/Domain/Sport/Sport'
import { Activity } from '~/src/modules/Activity/Domain/Activity'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { SpecFactory } from '~/src/modules/Activity/Domain/Config/Spec/SpecFactory'
import { ActivityTitle } from '~/src/modules/Activity/Domain/ValueObject/ActivityTitle'
import { Participation } from '~/src/modules/Activity/Domain/Participation/Participation'
import { isAvailableSpec } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'
import { CapabilityFactory } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityFactory'
import { ActivityDescription } from '~/src/modules/Activity/Domain/ValueObject/ActivityDescription'
import { ActivityScheduledDate } from '~/src/modules/Activity/Domain/ValueObject/ActivityScheduledDate'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { CreateActivityCommand } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityCommand'
import { isAvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { ActivityValidatedConfig } from '~/src/modules/Activity/Domain/ValueObject/ActivityValidatedConfig'
import { SportRepositoryInterface } from '~/src/modules/Activity/Domain/Sport/SportRepositoryInterface'
import { ActivityRepositoryInterface } from '~/src/modules/Activity/Domain/ActivityRepositoryInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { SpecPayloadContractFactory } from '~/src/modules/Activity/Application/Config/Spec/SpecPayloadContractFactory'
import { ParticipantRepositoryInterface } from '~/src/modules/Activity/Domain/Participant/ParticipantRepositoryInterface'
import { ParticipationRepositoryInterface } from '~/src/modules/Activity/Domain/Participation/ParticipationRepositoryInterface'
import { CapabilityPayloadContractFactory } from '~/src/modules/Activity/Application/Config/Capability/CapabilityPayloadContractFactory'
import { CreateActivityApplicationRequestDto } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationRequestDto'
import { CreateActivityApplicationResponseDto } from '~/src/modules/Activity/Application/CreateActivity/CreateActivityApplicationResponseDto'
import { SportDomainException, SportDomainExceptionAggregate } from '~/src/modules/Activity/Domain/Sport/SportDomainException'
import {
  CreateActivityCommandError,
  CreateActivityInputError,
} from '~/src/modules/Activity/Application/CreateActivity/CreateActivityCommandError'

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

export class CreateActivityCommandHandler {
  constructor(
    private participantRepository: ParticipantRepositoryInterface,
    private sportRepository: SportRepositoryInterface,
    private activityRepository: ActivityRepositoryInterface,
    private participationRepository: ParticipationRepositoryInterface,
    private clockService: ClockServiceInterface,
    private unitOfWork: UnitOfWork,
    private loggerService: LoggerServiceInterface,
    private idGeneratorService: IdGeneratorServiceInterface,
    private capabilityPayloadContractFactory: CapabilityPayloadContractFactory,
    private specPayloadContractFactory: SpecPayloadContractFactory,
    private capabilityFactory: CapabilityFactory,
    private specFactory: SpecFactory,
  ) {}

  public async execute(
    request: CreateActivityCommand,
  ): Promise<Result<CreateActivityApplicationResponseDto, CreateActivityCommandError>> {
    const now = this.clockService.now()

    const userIdAndSportIdValidationResult = this.validateUserIdAndSportId(request.userId, request.sportId)

    if (!userIdAndSportIdValidationResult.success) {
      return userIdAndSportIdValidationResult
    }

    const { userId, sportId } = userIdAndSportIdValidationResult.value

    const sport = await this.sportRepository.findById(sportId)

    if (!sport) {
      return fail(CreateActivityCommandError.sportNotFound())
    }

    const activityDataValidationResult = this.validateActivityData(sport, request, now)

    if (!activityDataValidationResult.success) {
      return activityDataValidationResult
    }

    const { activityTitle, activityDescription, activityScheduledDate, activityConfig } = activityDataValidationResult.value

    return this.unitOfWork.runInTransaction(async (context) => {
      const participant = await this.participantRepository.findById(userId, context)

      if (!participant) {
        this.loggerService.warn('Inconsistent state', { id: userId.value, reason: 'Participant not found (user)' })
        return fail(CreateActivityCommandError.userNotFound())
      }

      if (!participant.isActive()) {
        this.loggerService.warn('Inconsistent state', { id: userId.value, reason: 'Participant is disabled (user)' })
        return fail(CreateActivityCommandError.userDisabled())
      }

      const activityId = Identifier.create(this.idGeneratorService.generateId())
      const domainEventId = Identifier.create(this.idGeneratorService.generateId())

      const newActivity = Activity.create(
        activityId,
        sport.id,
        domainEventId,
        activityTitle,
        activityDescription,
        userId,
        activityConfig,
        activityScheduledDate,
        now,
      )

      const participationId = Identifier.create(this.idGeneratorService.generateId())
      const newParticipation = Participation.create(participationId, activityId, userId, now)

      await this.activityRepository.save(newActivity, context)
      await this.participationRepository.save(newParticipation, context)

      return success({ id: newActivity.id.value })
    })
  }

  private validateUserIdAndSportId(
    userId: CreateActivityApplicationRequestDto['userId'],
    sportId: CreateActivityApplicationRequestDto['sportId'],
  ): Result<ValidateUserIdAndSportId, CreateActivityCommandError> {
    const userIdResult = Identifier.safeCreate(userId)
    if (!userIdResult.success) {
      return fail(CreateActivityCommandError.invalidUserId(userIdResult.error.message))
    }

    const sportIdResult = Identifier.safeCreate(sportId)
    if (!sportIdResult.success) {
      return fail(CreateActivityCommandError.invalidSportId(sportIdResult.error.message))
    }

    return success({ userId: userIdResult.value, sportId: sportIdResult.value })
  }

  private validateActivityData(
    sport: Sport,
    request: CreateActivityApplicationRequestDto,
    now: Date,
  ): Result<ValidatedActivityData, CreateActivityCommandError> {
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

    const validPayloadCapabilities: Record<string, unknown> = {}
    const validPayloadSpecs: Record<string, unknown> = {}

    for (const [capabilityName, rawValue] of Object.entries(request.config.capabilities)) {
      if (!isAvailableCapability(capabilityName)) {
        errors.push(CreateActivityInputError.unavailableError(`config.capabilities.${capabilityName}`, 'capability'))
        continue
      }

      const validator = this.capabilityPayloadContractFactory.getContract(capabilityName)
      const validationResult = validator.validate(rawValue)

      if (!validationResult.success) {
        errors.push(CreateActivityInputError.validationError(`config.capabilities.${capabilityName}`, validationResult.error.errors))
      } else {
        validPayloadCapabilities[capabilityName] = validationResult.value
      }
    }

    for (const [specName, rawValue] of Object.entries(request.config.specs)) {
      if (!isAvailableSpec(specName)) {
        errors.push(CreateActivityInputError.unavailableError(`config.specs.${specName}`, 'spec'))
        continue
      }

      const validator = this.specPayloadContractFactory.getContract(specName)
      const validationResult = validator.validate(rawValue)

      if (!validationResult.success) {
        errors.push(CreateActivityInputError.validationError(`config.specs.${specName}`, validationResult.error.errors))
      } else {
        validPayloadSpecs[specName] = validationResult.value
      }
    }

    if (errors.length > 0) {
      return fail(CreateActivityCommandError.invalidInput(errors))
    }

    const configResult = sport.createActivityConfig(
      validPayloadCapabilities,
      validPayloadSpecs,
      this.capabilityFactory,
      this.specFactory,
    )

    if (!configResult.success) {
      const inputError = this.mapDomainErrors(configResult.error)

      return fail(inputError)
    }

    return success({
      activityTitle: activityTitle!,
      activityDescription,
      activityScheduledDate: activityScheduledDate!,
      activityConfig: configResult.value,
    })
  }

  private mapDomainErrors(domainError: SportDomainExceptionAggregate): CreateActivityCommandError {
    const errors: Array<CreateActivityInputError> = []

    if (domainError.details) {
      for (const [fieldPath, fieldErrors] of Object.entries(domainError.details)) {
        for (const err of fieldErrors) {
          switch (err.id) {
            case SportDomainException.missingActivityParticipantsSpecId:
              errors.push(CreateActivityInputError.missingError(`config.${fieldPath}`, err.message))
              break

            case SportDomainException.unsupportedCapabilityId:
            case SportDomainException.unsupportedSpecId:
              errors.push(CreateActivityInputError.unavailableError(`config.${fieldPath}`, err.message))
              break

            case SportDomainException.activityParticipantsSpecConflictId:
              errors.push(CreateActivityInputError.conflictError(`config.${fieldPath}`, err.message))
              break

            default:
              errors.push(CreateActivityInputError.validationError(`config.${fieldPath}`, err.message))
          }
        }
      }
    } else {
      errors.push(CreateActivityInputError.validationError('config', domainError.message))
    }

    return CreateActivityCommandError.invalidInput(errors)
  }
}
