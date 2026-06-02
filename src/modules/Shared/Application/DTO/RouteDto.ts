import { LocationQueryDto } from '~/src/modules/Shared/Application/DTO/MagnitudeQueryDto'

export interface RouteQueryDto {
  readonly points: Array<LocationQueryDto>
}
