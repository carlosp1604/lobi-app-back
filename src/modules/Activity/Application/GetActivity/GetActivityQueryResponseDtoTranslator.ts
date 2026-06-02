import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Duration'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { AvailableSpec } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { ActivityHostDto } from '~/src/modules/Activity/Application/Dto/ActivityHostDto'
import { SpecTranslatorFactory } from '~/src/modules/Activity/Application/Translator/Config/Spec/SpecTranslatorFactory'
import { SportDtoTranslator } from '~/src/modules/Activity/Application/Translator/Sport/SportDtoTranslator'
import { SportLevelDtoTranslator } from '~/src/modules/Activity/Application/Translator/Sport/SportLevelDtoTranslator'
import { ActivityDetailsReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityDetailsReadModel'
import { LocationDto, MagnitudeDto } from '~/src/modules/Shared/Application/DTO/MagnitudeDto'
import { RouteCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/RouteCapability'
import { DurationDtoTranslator } from '~/src/modules/Shared/Application/Translator/DurationDtoTranslator'
import { LocationDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationDtoTranslator'
import { GetActivityResponseDto } from '~/src/modules/Activity/Application/GetActivity/GetActivityResponseDto'
import { CapabilityTranslatorFactory } from '~/src/modules/Activity/Application/Translator/Config/Capability/CapabilityTranslatorFactory'
import { ActivityParticipationDto } from '~/src/modules/Activity/Application/Dto/ActivityParticipationDto'
import { ActivityHostDtoTranslator } from '~/src/modules/Activity/Application/Translator/ActivityHostDtoTranslator'
import { DtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/DtoTranslatorInterface'
import { ActivityParticipationDtoTranslator } from '~/src/modules/Activity/Application/Translator/Participation/ActivityParticipationDtoTranslator'

export interface GetActivityResponseContext {
  rawData: ActivityDetailsReadModel
  userId: Identifier | null
}

export class GetActivityQueryResponseDtoTranslator
  implements DtoTranslatorInterface<GetActivityResponseContext, GetActivityResponseDto>
{
  constructor(
    private readonly capabilityTranslatorFactory: CapabilityTranslatorFactory,
    private readonly specTranslatorFactory: SpecTranslatorFactory,
  ) {}

  public translate(context: GetActivityResponseContext): GetActivityResponseDto {
    const { rawData, userId } = context
    const { host, current_participation } = rawData

    let isHost = false
    let isParticipant = false

    if (host && userId) {
      isHost = host.id === userId.value
    }

    if (userId && current_participation) {
      isParticipant = true
    }

    const translatedCapabilities = Object.keys(rawData.activity_config.capabilities).reduce<Record<string, unknown>>(
      (accumulator, currentValue) => {
        const capabilityName = currentValue as AvailableCapability
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const rawCapabilityData = rawData.activity_config.capabilities[currentValue] as any

        if (capabilityName === 'route') {
          const routeCapabilityPrimitives = rawCapabilityData as RouteCapabilityPrimitives
          const isRoutePublic = routeCapabilityPrimitives.isPublic
          const canSeeRoute = isRoutePublic || isHost

          if (!canSeeRoute) {
            return accumulator
          }
        }

        const translator = this.capabilityTranslatorFactory.getTranslator(capabilityName)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        accumulator[capabilityName] = translator.translate(rawCapabilityData)

        return accumulator
      },
      {},
    )

    const translatedSpec = Object.keys(rawData.activity_config.specs).reduce<Record<string, unknown>>((accumulator, currentValue) => {
      const translator = this.specTranslatorFactory.getTranslator(currentValue as AvailableSpec)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      accumulator[currentValue] = translator.translate(rawData.activity_config.specs[currentValue] as any)

      return accumulator
    }, {})

    let location: LocationDto | null = null

    if (rawData.location_geojson) {
      location = new LocationDtoTranslator().translate({
        lng: String(rawData.location_geojson.coordinates[0]),
        lat: String(rawData.location_geojson.coordinates[1]),
      })
    }

    let duration: { min: MagnitudeDto; max: MagnitudeDto } | null = null

    if (rawData.min_duration && rawData.max_duration) {
      duration = {
        min: new DurationDtoTranslator().translate({
          value: String(rawData.min_duration),
          normalizedValue: String(rawData.min_duration),
          unit: Duration.DEFAULT_UNIT,
        }),
        max: new DurationDtoTranslator().translate({
          value: String(rawData.max_duration),
          normalizedValue: String(rawData.max_duration),
          unit: Duration.DEFAULT_UNIT,
        }),
      }
    }

    let activityHost: ActivityHostDto | null = null
    let currentParticipation: ActivityParticipationDto | null = null

    if (rawData.host) {
      activityHost = new ActivityHostDtoTranslator().translate(rawData.host)
    }

    if (rawData.current_participation) {
      currentParticipation = new ActivityParticipationDtoTranslator().translate(rawData.current_participation)
    }

    const levels = rawData.levels.map((level) => new SportLevelDtoTranslator().translate(level))

    return {
      activity: {
        id: rawData.id,
        title: rawData.title,
        description: rawData.description,
        location,
        status: rawData.status,
        currentParticipants: rawData.current_participants,
        scheduledAt: rawData.scheduled_at,
        createdAt: rawData.created_at,
        capacity: {
          min: rawData.min_capacity,
          max: rawData.max_capacity,
        },
        duration: duration,
        levels,
        activityConfig: {
          capabilities: translatedCapabilities,
          specs: translatedSpec,
        },
      },
      sport: new SportDtoTranslator().translate(rawData.sport),
      host: activityHost,
      participation: currentParticipation,
      isHost,
      isParticipant,
    }
  }
}
