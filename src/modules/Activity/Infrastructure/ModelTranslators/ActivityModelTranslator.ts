import { Activity } from '~/src/modules/Activity/Domain/Activity'
import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Duration'
import { Location } from '~/src/modules/Shared/Domain/ValueObject/Location/Location'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { SpecFactory } from '~/src/modules/Activity/Domain/Config/Spec/SpecFactory'
import { SpecTypeMap } from '~/src/modules/Activity/Domain/Config/Spec/SpecRegistry'
import { ActivityTitle } from '~/src/modules/Activity/Domain/ValueObject/ActivityTitle'
import { AvailableSpec } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'
import { IntegerNumber } from '~/src/modules/Shared/Domain/ValueObject/Numeric/IntegerNumber'
import { ActivityStatus } from '~/src/modules/Activity/Domain/ValueObject/ActivityStatus'
import { CapabilityFactory } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityFactory'
import { CapabilityTypeMap } from '~/src/modules/Activity/Domain/Config/Capability/CapabilityRegistry'
import { ActivityDescription } from '~/src/modules/Activity/Domain/ValueObject/ActivityDescription'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { ActivityScheduledDate } from '~/src/modules/Activity/Domain/ValueObject/ActivityScheduledDate'
import { ActivityRawModel, RawActivityConfig, RawLocation } from '~/src/modules/Activity/Infrastructure/Entities/activity.entity'
import {
  ActivityValidatedConfig,
  ValidatedCapabilities,
  ValidatedSpecs,
} from '~/src/modules/Activity/Domain/ValueObject/ActivityValidatedConfig'

export class ActivityModelTranslator {
  constructor(
    private readonly capabilityFactory: CapabilityFactory,
    private readonly specFactory: SpecFactory,
  ) {}

  public toDomain(raw: ActivityRawModel): Activity {
    let minDuration: Duration | null = null
    let maxDuration: Duration | null = null

    if (raw.min_duration) {
      const stringValue = String(raw.min_duration)
      minDuration = Duration.fromPrimitives({ value: stringValue, normalizedValue: stringValue, unit: Duration.DEFAULT_UNIT })
    }

    if (raw.max_duration) {
      const stringValue = String(raw.max_duration)
      maxDuration = Duration.fromPrimitives({ value: stringValue, normalizedValue: stringValue, unit: Duration.DEFAULT_UNIT })
    }

    const { capabilities: rawCapabilities, specs: rawSpecs } = raw.activity_config

    const validatedCapabilities: ValidatedCapabilities = Object.keys(rawCapabilities).reduce((accumulator, currentValue) => {
      const capabilityName = currentValue as AvailableCapability

      accumulator[capabilityName] = this.capabilityFactory.fromPrimitives(
        capabilityName,
        rawCapabilities[capabilityName] as CapabilityTypeMap[typeof capabilityName]['primitives'],
      )

      return accumulator
    }, {})

    const validatedSpecs: ValidatedSpecs = Object.keys(rawSpecs).reduce((accumulator, currentValue) => {
      const specName = currentValue as AvailableSpec

      accumulator[specName] = this.specFactory.fromPrimitives(
        specName,
        rawCapabilities[specName] as SpecTypeMap[typeof specName]['primitives'],
      )

      return accumulator
    }, {})

    const activityConfig = ActivityValidatedConfig.create({
      config: { capabilities: validatedCapabilities, specs: validatedSpecs },
    })

    return Activity.reconstitute(
      Identifier.create(raw.id),
      ActivityTitle.fromString(raw.title),
      raw.description ? ActivityDescription.fromString(raw.description) : null,
      ActivityStatus.fromString(raw.status),
      Identifier.create(raw.sport_id),
      raw.level_ids.map((id) => Identifier.create(id)),
      Identifier.create(raw.host_id),
      IntegerNumber.create(raw.min_capacity),
      IntegerNumber.create(raw.max_capacity),
      minDuration,
      maxDuration,
      IntegerNumber.create(raw.current_participants),
      raw.location ? this.locationToDomain(raw.location) : null,
      activityConfig,
      ActivityScheduledDate.fromDate(raw.scheduled_at),
      raw.created_at,
      raw.updated_at,
    )
  }

  public toDatabase(domain: Activity): ActivityRawModel {
    const rawCapabilities: Record<string, unknown> = Object.keys(domain.config.capabilities).reduce((accumulator, currentValue) => {
      const capabilityName = currentValue as AvailableCapability

      accumulator[capabilityName] = domain.config.capabilities[capabilityName]!.toPrimitives()

      return accumulator
    }, {})

    const rawSpecs: Record<string, unknown> = Object.keys(domain.config.specs).reduce((accumulator, currentValue) => {
      const specName = currentValue as AvailableSpec

      accumulator[specName] = domain.config.specs[specName]!.toPrimitives()

      return accumulator
    }, {})

    const rawActivityConfig: RawActivityConfig = { capabilities: rawCapabilities, specs: rawSpecs }

    return {
      id: domain.id.toPrimitives(),
      title: domain.title.toPrimitives(),
      description: domain.description?.toPrimitives() ?? null,
      status: domain.status.toPrimitives(),
      sport_id: domain.sportId.toPrimitives(),
      level_ids: domain.levels.map((id) => id.toPrimitives()),
      host_id: domain.hostId.toPrimitives(),
      min_capacity: domain.minCapacity.toPrimitives(),
      max_capacity: domain.maxCapacity.toPrimitives(),
      current_participants: domain.currentParticipants.toPrimitives(),
      min_duration: domain.minDuration?.value.toPrimitives() ?? null,
      max_duration: domain.maxDuration?.value.toPrimitives() ?? null,
      location: domain.location ? this.locationToDatabase(domain.location) : null,
      activity_config: rawActivityConfig,
      scheduled_at: domain.scheduledAt.toPrimitives(),
      created_at: domain.createdAt,
      updated_at: domain.updatedAt,
    }
  }

  private locationToDomain(rawLocation: RawLocation): Location {
    const lng = rawLocation.coordinates[0]
    const lat = rawLocation.coordinates[0]

    return Location.fromPrimitives({ lng: String(lng), lat: String(lat) })
  }

  private locationToDatabase(location: Location): RawLocation {
    const primitivesLocation = location.toPrimitives()

    return {
      type: 'Point',
      coordinates: [Number(primitivesLocation.lng), Number(primitivesLocation.lat)],
    }
  }
}
