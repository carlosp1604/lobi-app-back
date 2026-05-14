import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { CancelActivityCommand } from '~/src/modules/Activity/Application/CancelActivity/CancelActivityCommand'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { CancelActivityCommandError } from '~/src/modules/Activity/Application/CancelActivity/CancelActivityCommandError'
import { ActivityRepositoryInterface } from '~/src/modules/Activity/Domain/ActivityRepositoryInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { ParticipantRepositoryInterface } from '~/src/modules/Activity/Domain/Participant/ParticipantRepositoryInterface'

type ValidatedCancelActivityCommandInput = {
  userId: Identifier
  activityId: Identifier
}

export class CancelActivityCommandHandler {
  constructor(
    private participantRepository: ParticipantRepositoryInterface,
    private activityRepository: ActivityRepositoryInterface,
    private clockService: ClockServiceInterface,
    private unitOfWork: UnitOfWork,
    private loggerService: LoggerServiceInterface,
    private idGeneratorService: IdGeneratorServiceInterface,
  ) {}

  public async execute(command: CancelActivityCommand): Promise<Result<void, CancelActivityCommandError>> {
    const now = this.clockService.now()

    const validateCommandResult = this.validateCommand(command)

    if (!validateCommandResult.success) {
      return validateCommandResult
    }

    const { userId, activityId } = validateCommandResult.value

    return this.unitOfWork.runInTransaction(async (context) => {
      const participant = await this.participantRepository.findById(userId, context)

      if (!participant) {
        this.loggerService.warn('Inconsistent state', {
          id: userId.value,
          reason: 'Participant not found (user)',
        })

        return fail(CancelActivityCommandError.userNotFound())
      }

      if (!participant.isActive()) {
        this.loggerService.warn('Inconsistent state', {
          id: userId.value,
          reason: 'Participant is disabled (user)',
        })

        return fail(CancelActivityCommandError.userDisabled())
      }

      const activity = await this.activityRepository.findByIdWithLock(activityId, context)

      if (!activity) {
        return fail(CancelActivityCommandError.activityNotFound())
      }

      const canBeCancelledByResult = activity.canBeCancelledBy(participant.id)

      if (!canBeCancelledByResult.success) {
        return fail(this.mapActivityCanBeCancelledByException(canBeCancelledByResult.error))
      }

      const activityCancelledDomainEventId = Identifier.create(this.idGeneratorService.generateId())

      activity.cancel(activityCancelledDomainEventId, participant.id, now)

      await this.activityRepository.save(activity, context)

      return success(undefined)
    })
  }

  private mapActivityCanBeCancelledByException(exception: ActivityDomainException): CancelActivityCommandError {
    switch (exception.id) {
      case ActivityDomainException.activityStatusDoesNotAllowCancelId:
        return CancelActivityCommandError.activityStatusDoesNotAllowCancel(exception.message)
      case ActivityDomainException.onlyHostCanCancelActivityId:
        return CancelActivityCommandError.onlyHostCanCancelActivity(exception.message)
      case ActivityDomainException.activityCannotBeCancelledWithParticipantsId:
        return CancelActivityCommandError.activityCannotBeCancelledWithParticipants(exception.message)

      default:
        throw exception
    }
  }

  private validateCommand(command: CancelActivityCommand): Result<ValidatedCancelActivityCommandInput, CancelActivityCommandError> {
    const userIdResult = Identifier.safeCreate(command.userId)

    if (!userIdResult.success) {
      return fail(CancelActivityCommandError.invalidUserId(userIdResult.error.message))
    }

    const userId = userIdResult.value

    const activityIdResult = Identifier.safeCreate(command.activityId)

    if (!activityIdResult.success) {
      return fail(CancelActivityCommandError.invalidActivityId(activityIdResult.error.message))
    }

    const activityId = activityIdResult.value

    return success({ userId, activityId })
  }
}
