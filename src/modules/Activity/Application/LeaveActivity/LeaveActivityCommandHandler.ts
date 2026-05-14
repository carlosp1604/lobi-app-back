import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { LeaveActivityCommand } from '~/src/modules/Activity/Application/LeaveActivity/LeaveActivityCommand'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { LeaveActivityCommandError } from '~/src/modules/Activity/Application/LeaveActivity/LeaveActivityCommandError'
import { ActivityRepositoryInterface } from '~/src/modules/Activity/Domain/ActivityRepositoryInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { ParticipationDomainException } from '~/src/modules/Activity/Domain/Participation/ParticipationDomainException'
import { ParticipantRepositoryInterface } from '~/src/modules/Activity/Domain/Participant/ParticipantRepositoryInterface'
import { ParticipationRepositoryInterface } from '~/src/modules/Activity/Domain/Participation/ParticipationRepositoryInterface'

type ValidatedLeaveActivityCommand = {
  userId: Identifier
  activityId: Identifier
}

export class LeaveActivityCommandHandler {
  constructor(
    private participantRepository: ParticipantRepositoryInterface,
    private activityRepository: ActivityRepositoryInterface,
    private participationRepository: ParticipationRepositoryInterface,
    private clockService: ClockServiceInterface,
    private unitOfWork: UnitOfWork,
    private loggerService: LoggerServiceInterface,
    private idGeneratorService: IdGeneratorServiceInterface,
  ) {}

  public async execute(command: LeaveActivityCommand): Promise<Result<void, LeaveActivityCommandError>> {
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

        return fail(LeaveActivityCommandError.userNotFound())
      }

      if (!participant.isActive()) {
        this.loggerService.warn('Inconsistent state', {
          id: userId.value,
          reason: 'Participant is disabled (user)',
        })

        return fail(LeaveActivityCommandError.userDisabled())
      }

      const activity = await this.activityRepository.findByIdWithLock(activityId, context)

      if (!activity) {
        return fail(LeaveActivityCommandError.activityNotFound())
      }

      const canBeLeftAtResult = activity.canBeLeftAt(now, userId)

      if (!canBeLeftAtResult.success) {
        const exception = canBeLeftAtResult.error

        if (exception.id !== ActivityDomainException.hostCannotLeaveActivityId) {
          return fail(this.mapActivityCanBeLeftException(exception))
        }

        const candidateHostParticipation = await this.participationRepository.findHostCandidate(activity.id, activity.hostId, context)

        if (!candidateHostParticipation) {
          this.loggerService.warn('Inconsistent state', {
            id: activity.id.value,
            reason: 'Sync Error: Expected to find a valid host candidate, but none was returned',
            hostId: activity.hostId.value,
            leavingParticipantId: participant.id.value,
            currentParticipants: activity.currentParticipants.value,
            activityStatus: activity.status.value,
          })

          return fail(LeaveActivityCommandError.activityInconsistentState())
        }

        const canReplaceHostResult = activity.canReplaceHost(candidateHostParticipation.participantId)

        if (!canReplaceHostResult.success) {
          const exception = canReplaceHostResult.error

          if (exception.id === ActivityDomainException.cannotReplaceHostWithCurrentHostId) {
            this.loggerService.warn('Inconsistent state', {
              id: activity.id.value,
              reason: 'Sync Error: Expected to find a valid host candidate, but the current host was returned',
              hostId: activity.hostId.value,
              leavingParticipantId: participant.id.value,
              currentParticipants: activity.currentParticipants.value,
              activityStatus: activity.status.value,
            })

            return fail(LeaveActivityCommandError.activityInconsistentState())
          }

          throw exception
        }

        const newHostDomainEventId = Identifier.create(this.idGeneratorService.generateId())

        activity.replaceHost(candidateHostParticipation.participantId, newHostDomainEventId, now)
      }

      const currentParticipation = await this.participationRepository.findByParticipantAndActivityId(userId, activityId, context)

      if (!currentParticipation) {
        return fail(LeaveActivityCommandError.userIsNotAParticipant())
      }

      const canDisableResult = currentParticipation.canDisable()

      if (!canDisableResult.success) {
        const exception = canDisableResult.error

        if (exception.id === ParticipationDomainException.participationIsAlreadyInactiveId) {
          return fail(LeaveActivityCommandError.userIsNotAParticipant())
        }

        throw exception
      }

      currentParticipation.disable(now)

      const participantLeftDomainEventId = Identifier.create(this.idGeneratorService.generateId())
      const activityCancelledDomainEventId = Identifier.create(this.idGeneratorService.generateId())

      activity.leave(participantLeftDomainEventId, activityCancelledDomainEventId, participant.id, now)

      await this.participationRepository.save(currentParticipation, context)

      await this.activityRepository.save(activity, context)

      return success(undefined)
    })
  }

  private mapActivityCanBeLeftException(exception: ActivityDomainException): LeaveActivityCommandError {
    switch (exception.id) {
      case ActivityDomainException.activityDoesNotAllowLeaveId:
        return LeaveActivityCommandError.activityDoesNotAllowLeave(exception.message)
      case ActivityDomainException.activityLeaveMarginDoesNotMeetId:
        return LeaveActivityCommandError.activityLeaveMarginDoesNotMeet(exception.message)
      case ActivityDomainException.activityConfirmedToTakePlaceId:
        return LeaveActivityCommandError.activityConfirmedToTakePlace(exception.message)

      default:
        throw exception
    }
  }

  private validateCommand(command: LeaveActivityCommand): Result<ValidatedLeaveActivityCommand, LeaveActivityCommandError> {
    const userIdResult = Identifier.safeCreate(command.userId)

    if (!userIdResult.success) {
      return fail(LeaveActivityCommandError.invalidUserId(userIdResult.error.message))
    }

    const userId = userIdResult.value

    const activityIdResult = Identifier.safeCreate(command.activityId)

    if (!activityIdResult.success) {
      return fail(LeaveActivityCommandError.invalidActivityId(activityIdResult.error.message))
    }

    const activityId = activityIdResult.value

    return success({ userId, activityId })
  }
}
