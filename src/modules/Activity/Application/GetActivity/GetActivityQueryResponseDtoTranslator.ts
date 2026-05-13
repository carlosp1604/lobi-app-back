import { Duration } from '~/src/modules/Shared/Domain/ValueObject/Magnitude/Duration'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'
import { AvailableSpec } from '~/src/modules/Activity/Domain/Config/Spec/AvailableSpecs'
import { AvailableCapability } from '~/src/modules/Activity/Domain/Config/Capability/AvailableCapabilities'
import { ActivityHostQueryDto } from '~/src/modules/Activity/Application/Dto/ActivityHostQueryDto'
import { SpecTranslatorFactory } from '~/src/modules/Activity/Application/Translator/Config/Spec/SpecTranslatorFactory'
import { SportQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Sport/SportQueryDtoTranslator'
import { ActivityDetailsReadModel } from '~/src/modules/Activity/Application/ReadModel/ActivityDetailsReadModel'
import { RouteCapabilityPrimitives } from '~/src/modules/Activity/Domain/Config/Capability/RouteCapability'
import { DurationQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/DurationQueryDtoTranslator'
import { LocationQueryDtoTranslator } from '~/src/modules/Shared/Application/Translator/LocationQueryDtoTranslator'
import { GetActivityQueryResponseDto } from '~/src/modules/Activity/Application/GetActivity/GetActivityQueryResponseDto'
import { CapabilityTranslatorFactory } from '~/src/modules/Activity/Application/Translator/Config/Capability/CapabilityTranslatorFactory'
import { ActivityHostQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/ActivityHostQueryDtoTranslator'
import { RankingChoiceQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Sport/RankingChoiceQueryDtoTranslator'
import { ApplicationDtoTranslatorInterface } from '~/src/modules/Shared/Application/Translator/ApplicationDtoTranslatorInterface'
import { LocationQueryDto, MagnitudeQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'
import { ActivityParticipationQueryDto } from '~/src/modules/Activity/Application/Dto/ActivityParticipationQueryDto'
import { ActivityParticipationQueryDtoTranslator } from '~/src/modules/Activity/Application/Translator/Participation/ActivityParticipationQueryDtoTranslator'

export interface GetActivityResponseContext {
  rawData: ActivityDetailsReadModel
  userId: Identifier | null
}

export class GetActivityQueryResponseDtoTranslator
  implements ApplicationDtoTranslatorInterface<GetActivityResponseContext, GetActivityQueryResponseDto>
{
  constructor(
    private readonly capabilityTranslatorFactory: CapabilityTranslatorFactory,
    private readonly specTranslatorFactory: SpecTranslatorFactory,
  ) {}

  public translate(context: GetActivityResponseContext): GetActivityQueryResponseDto {
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

    let location: LocationQueryDto | null = null

    if (rawData.location_geojson) {
      location = new LocationQueryDtoTranslator().translate({
        lng: String(rawData.location_geojson.coordinates[0]),
        lat: String(rawData.location_geojson.coordinates[1]),
      })
    }

    let duration: { min: MagnitudeQueryDto; max: MagnitudeQueryDto } | null = null

    if (rawData.min_duration && rawData.max_duration) {
      duration = {
        min: new DurationQueryDtoTranslator().translate({
          value: String(rawData.min_duration),
          normalizedValue: String(rawData.min_duration),
          unit: Duration.DEFAULT_UNIT,
        }),
        max: new DurationQueryDtoTranslator().translate({
          value: String(rawData.min_duration),
          normalizedValue: String(rawData.min_duration),
          unit: Duration.DEFAULT_UNIT,
        }),
      }
    }

    let activityHost: ActivityHostQueryDto | null = null
    let currentParticipation: ActivityParticipationQueryDto | null = null

    if (rawData.host) {
      activityHost = new ActivityHostQueryDtoTranslator().translate(rawData.host)
    }

    if (rawData.current_participation) {
      currentParticipation = new ActivityParticipationQueryDtoTranslator().translate(rawData.current_participation)
    }

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
        levels: new RankingChoiceQueryDtoTranslator().translate(rawData.levels),
        activityConfig: {
          capabilities: translatedCapabilities,
          specs: translatedSpec,
        },
      },
      sport: new SportQueryDtoTranslator().translate(rawData.sport),
      host: activityHost,
      participation: currentParticipation,
      isHost,
      isParticipant,
    }
  }
}
