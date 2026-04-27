import { Sport } from '~/src/modules/Activity/Domain/Sport/Sport'
import { Activity } from '~/src/modules/Activity/Domain/Activity'
import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Magnitude/Duration'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Measurable/Location'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { ActivityTitle } from '~/src/modules/Activity/Domain/ActivityTitle'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Measurable/IntegerNumber'
import { ActivityStatus } from '~/src/modules/Activity/Domain/ActivityStatus'
import { ActivityDescription } from '~/src/modules/Activity/Domain/ActivityDescription'
import { ActivityRawModel } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'
import { ActivityScheduledDate } from '~/src/modules/Activity/Domain/ActivityScheduledDate'
import { ActivityValidatedConfigTranslator } from '~/src/modules/Activity/Infrastructure/ModelTranslators/ActivityValidatedConfigTranslator'

export class ActivityModelTranslator {
  public static toDomain(raw: ActivityRawModel, sport: Sport): Activity {
    const activityConfigResult = ActivityValidatedConfigTranslator.toDomain(raw.activity_config, sport)

    if (!activityConfigResult.success) {
      throw new Error(`Corrupted data detected while reconstituting activity with ID ${raw.id}. Reason: ${activityConfigResult.error}`)
    }

    return Activity.reconstitute(
      Identifier.fromString(raw.id),
      ActivityTitle.fromString(raw.title),
      raw.description ? ActivityDescription.fromString(raw.description) : null,
      ActivityStatus.fromString(raw.status),
      Identifier.fromString(raw.sport_id),
      raw.level_ids.map((levelId) => Identifier.fromString(levelId)),
      Identifier.fromString(raw.host_id),
      IntegerNumber.fromNumber(raw.min_capacity),
      IntegerNumber.fromNumber(raw.max_capacity),
      raw.min_duration ? Duration.fromNumber(raw.min_duration) : null,
      raw.max_duration ? Duration.fromNumber(raw.max_duration) : null,
      IntegerNumber.fromNumber(raw.current_participants),
      raw.location ? this.locationToDomain(raw.location) : null,
      activityConfigResult.value,
      ActivityScheduledDate.fromDate(raw.scheduled_at),
      raw.created_at,
      raw.updated_at,
    )
  }

  public static toDatabase(domain: Activity): ActivityRawModel {
    const rawActivityConfigResult = ActivityValidatedConfigTranslator.toDatabase(domain.config)

    if (!rawActivityConfigResult.success) {
      throw new Error(
        `Corrupted data detected while storing activity with ID ${domain.id.value}. Reason: ${rawActivityConfigResult.error}`,
      )
    }

    return {
      id: domain.id.toPrimitives(),
      title: domain.title.toPrimitives(),
      description: domain.description?.toPrimitives() ?? null,
      status: domain.status.toPrimitives(),
      sport_id: domain.sportId.toPrimitives(),
      level_ids: domain.levelIds.map((levelIds) => levelIds.toPrimitives()),
      host_id: domain.hostId.toPrimitives(),
      min_capacity: domain.minCapacity.toPrimitives(),
      max_capacity: domain.maxCapacity.toPrimitives(),
      current_participants: domain.currentParticipants.toPrimitives(),
      min_duration: domain.minDuration?.value.toPrimitives() ?? null,
      max_duration: domain.maxDuration?.value.toPrimitives() ?? null,
      location: domain.location ? this.locationToDatabase(domain.location) : null,
      activity_config: rawActivityConfigResult.value,
      scheduled_at: domain.scheduledAt.toPrimitives(),
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    }
  }

  private static locationToDomain(rawLocation: string): Location {
    const coords = rawLocation.replace('POINT(', '').replace(')', '').split(' ')
    return Location.fromProps({ lat: coords[1], lng: coords[0] })
  }

  private static locationToDatabase(location: Location): string {
    return `POINT(${location.value.lng.toPrimitives()} ${location.value.lat.toPrimitives()})`
  }
}
