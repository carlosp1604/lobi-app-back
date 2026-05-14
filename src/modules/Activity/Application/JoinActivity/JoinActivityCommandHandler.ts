import { UnitOfWork } from '~/src/modules/Shared/Application/UnitOfWork'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { Participation } from '~/src/modules/Activity/Domain/Participation/Participation'
import { JoinActivityCommand } from '~/src/modules/Activity/Application/JoinActivity/JoinActivityCommand'
import { ClockServiceInterface } from '~/src/modules/Shared/Domain/ClockServiceInterface'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { ActivityDomainException } from '~/src/modules/Activity/Domain/ActivityDomainException'
import { JoinActivityCommandError } from '~/src/modules/Activity/Application/JoinActivity/JoinActivityCommandError'
import { ActivityRepositoryInterface } from '~/src/modules/Activity/Domain/ActivityRepositoryInterface'
import { IdGeneratorServiceInterface } from '~/src/modules/Shared/Domain/IdGeneratorServiceInterface'
import { ParticipationDomainException } from '~/src/modules/Activity/Domain/Participation/ParticipationDomainException'
import { ParticipantRepositoryInterface } from '~/src/modules/Activity/Domain/Participant/ParticipantRepositoryInterface'
import { ParticipationRepositoryInterface } from '~/src/modules/Activity/Domain/Participation/ParticipationRepositoryInterface'

type ValidatedJoinActivityCommandInput = {
  userId: Identifier
  activityId: Identifier
}

export class JoinActivityCommandHandler {
  constructor(
    private participantRepository: ParticipantRepositoryInterface,
    private activityRepository: ActivityRepositoryInterface,
    private participationRepository: ParticipationRepositoryInterface,
    private clockService: ClockServiceInterface,
    private unitOfWork: UnitOfWork,
    private loggerService: LoggerServiceInterface,
    private idGeneratorService: IdGeneratorServiceInterface,
  ) {}

  public async execute(command: JoinActivityCommand): Promise<Result<void, JoinActivityCommandError>> {
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

        return fail(JoinActivityCommandError.userNotFound())
      }

      if (!participant.isActive()) {
        this.loggerService.warn('Inconsistent state', {
          id: userId.value,
          reason: 'Participant is disabled (user)',
        })

        return fail(JoinActivityCommandError.userDisabled())
      }

      const activity = await this.activityRepository.findByIdWithLock(activityId, context)

      if (!activity) {
        return fail(JoinActivityCommandError.activityNotFound())
      }

      const canBeJoinedAtResult = activity.canBeJoinedAt(now)

      if (!canBeJoinedAtResult.success) {
        const exception = canBeJoinedAtResult.error

        switch (exception.id) {
          case ActivityDomainException.activityDoesNotAllowJoinId:
            return fail(JoinActivityCommandError.activityDoesNotAllowJoin(exception.message))
          case ActivityDomainException.activityAlreadyStartedId:
            return fail(JoinActivityCommandError.activityAlreadyStarted(exception.message))
          case ActivityDomainException.activityIsAlreadyFullId:
            return fail(JoinActivityCommandError.activityIsAlreadyFull(exception.message))

          default:
            throw exception
        }
      }

      const currentParticipation = await this.participationRepository.findByParticipantAndActivityId(userId, activityId, context)

      if (currentParticipation) {
        const canEnableResult = currentParticipation.canEnable()

        if (!canEnableResult.success) {
          const exception = canEnableResult.error

          if (exception.id === ParticipationDomainException.participationIsStillActiveId) {
            return fail(JoinActivityCommandError.participantAlreadyJoined())
          }

          throw exception
        }

        currentParticipation.enable(now)

        await this.participationRepository.save(currentParticipation, context)
      } else {
        const participationId = Identifier.create(this.idGeneratorService.generateId())

        const newParticipation = Participation.create(participationId, activityId, userId, now)

        await this.participationRepository.save(newParticipation, context)
      }

      const participantJoinedDomainEventId = Identifier.create(this.idGeneratorService.generateId())
      const activityConfirmedDomainEventId = Identifier.create(this.idGeneratorService.generateId())

      activity.join(participantJoinedDomainEventId, activityConfirmedDomainEventId, participant.id, now)

      await this.activityRepository.save(activity, context)

      return success(undefined)
    })
  }

  private validateCommand(command: JoinActivityCommand): Result<ValidatedJoinActivityCommandInput, JoinActivityCommandError> {
    const userIdResult = Identifier.safeCreate(command.userId)

    if (!userIdResult.success) {
      return fail(JoinActivityCommandError.invalidUserId(userIdResult.error.message))
    }

    const userId = userIdResult.value

    const activityIdResult = Identifier.safeCreate(command.activityId)

    if (!activityIdResult.success) {
      return fail(JoinActivityCommandError.invalidActivityId(activityIdResult.error.message))
    }

    const activityId = activityIdResult.value

    return success({ userId, activityId })
  }
}
